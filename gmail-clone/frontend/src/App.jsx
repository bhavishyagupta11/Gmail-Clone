import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Body from "./components/Body";
import Inbox from "./components/Inbox";
import Mail from "./components/Mail";
import SendEmail from "./components/SendEmail";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Settings from "./components/Settings";
import api from "./lib/api";
import {
  setAuthChecked,
  setAuthUser,
  setEmails,
  setOpen,
  setSelectedEmail,
  setSelectedFolder,
} from "./redux/appSlice";

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Body />,
    children: [
      {
        path: "/",
        element: <Inbox />,
      },
      {
        path: "/mail/:id",
        element: <Mail />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
]);

function App() {
  const dispatch = useDispatch();
  const { open, authChecked } = useSelector((store) => store);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const res = await api.get("/user/me");
        if (active && res.data.success) {
          dispatch(setAuthUser(res.data.user));
        }
      } catch {
        if (active) {
          dispatch(setAuthUser(null));
        }
      } finally {
        if (active) {
          dispatch(setAuthChecked(true));
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [dispatch]);

  useEffect(() => {
    const handleAuthExpired = async () => {
      try {
        await api.get("/user/logout");
      } catch {
        // no-op
      }

      dispatch(setAuthUser(null));
      dispatch(setEmails([]));
      dispatch(setSelectedEmail(null));
      dispatch(setOpen(false));
      dispatch(setSelectedFolder("inbox"));
      dispatch(setAuthChecked(true));
      window.location.href = "/login";
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [dispatch]);

  if (!authChecked) {
    return <div className="bg-[#F6F8FC] h-screen" />;
  }

  return (
    <div className="bg-[#F6F8FC] h-screen">
      <RouterProvider router={appRouter} />
      {open && <SendEmail />}
      <Toaster />
    </div>
  );
}

export default App;
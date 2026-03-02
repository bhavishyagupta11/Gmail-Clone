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
import api from "./lib/api";
import { setAuthChecked, setAuthUser } from "./redux/appSlice";

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
  const { open, user, authChecked } = useSelector((store) => store);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (user) {
        dispatch(setAuthChecked(true));
        return;
      }

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
  }, [dispatch, user]);

  if (!authChecked) {
    return <div className="bg-[#F6F8FC] h-screen" />;
  }

  return (
    <div className="bg-[#F6F8FC] h-screen">
      <RouterProvider router={appRouter} />
      {open && (
        <div className="absolute w-[30%] bottom-0 right-20 z-10">
          <SendEmail />
        </div>
      )}
      <Toaster />
    </div>
  );
}

export default App;
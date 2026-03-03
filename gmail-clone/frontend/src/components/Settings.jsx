import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import toast from "react-hot-toast";
import api from "../lib/api";
import { setAuthUser } from "../redux/appSlice";

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store);
  const [searchParams, setSearchParams] = useSearchParams();

  const [compactView, setCompactView] = React.useState(localStorage.getItem("compactView") === "true");
  const [enableTips, setEnableTips] = React.useState(localStorage.getItem("enableTips") !== "false");
  const [gmailLoading, setGmailLoading] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem("compactView", String(compactView));
  }, [compactView]);

  React.useEffect(() => {
    localStorage.setItem("enableTips", String(enableTips));
  }, [enableTips]);

  React.useEffect(() => {
    const status = searchParams.get("gmail");
    if (!status) return;

    const applyStatus = async () => {
      if (status === "connected") {
        toast.success("Gmail connected successfully.");
        try {
          const res = await api.get("/user/me");
          if (res.data.success) {
            dispatch(setAuthUser(res.data.user));
          }
        } catch {
          // no-op
        }
      } else if (status === "error") {
        toast.error("Gmail connection failed. Check Google OAuth setup.");
      }

      setSearchParams({}, { replace: true });
    };

    applyStatus();
  }, [dispatch, searchParams, setSearchParams]);

  const connectGmail = async () => {
    try {
      setGmailLoading(true);
      const res = await api.get("/gmail/connect-url");
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not start Gmail connect.");
    } finally {
      setGmailLoading(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      setGmailLoading(true);
      const res = await api.post("/gmail/disconnect");
      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        toast.success("Gmail disconnected.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not disconnect Gmail.");
    } finally {
      setGmailLoading(false);
    }
  };

  const gmailConnected = Boolean(user?.gmailConnected);

  return (
    <div className="flex-1 bg-white rounded-2xl mx-2 p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-gray-100">
          <IoArrowBack size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="border rounded-xl p-4">
          <p className="font-medium text-gray-800">Inbox view</p>
          <p className="text-sm text-gray-500 mb-3">Switch between default and compact spacing.</p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={compactView} onChange={(e) => setCompactView(e.target.checked)} />
            Compact density
          </label>
        </div>

        <div className="border rounded-xl p-4">
          <p className="font-medium text-gray-800">Product tips</p>
          <p className="text-sm text-gray-500 mb-3">Show onboarding and usage hints in UI.</p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={enableTips} onChange={(e) => setEnableTips(e.target.checked)} />
            Enable tips
          </label>
        </div>

        <div className="border rounded-xl p-4">
          <p className="font-medium text-gray-800">Gmail API connection</p>
          <p className="text-sm text-gray-500 mb-3">
            Connect your Gmail account to sync read/spam/star/delete actions with real Gmail.
          </p>
          {gmailConnected ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700">Connected: {user?.gmailConnectedEmail || "Gmail account"}</p>
              <button
                onClick={disconnectGmail}
                disabled={gmailLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {gmailLoading ? "Disconnecting..." : "Disconnect Gmail"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectGmail}
              disabled={gmailLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {gmailLoading ? "Connecting..." : "Connect Gmail"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;


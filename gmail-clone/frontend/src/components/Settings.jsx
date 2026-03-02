import React from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const Settings = () => {
  const navigate = useNavigate();
  const [compactView, setCompactView] = React.useState(
    localStorage.getItem("compactView") === "true"
  );
  const [enableTips, setEnableTips] = React.useState(
    localStorage.getItem("enableTips") !== "false"
  );

  React.useEffect(() => {
    localStorage.setItem("compactView", String(compactView));
  }, [compactView]);

  React.useEffect(() => {
    localStorage.setItem("enableTips", String(enableTips));
  }, [enableTips]);

  return (
    <div className="flex-1 bg-white rounded-2xl mx-2 p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-100">
          <IoArrowBack size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="border rounded-xl p-4">
          <p className="font-medium text-gray-800">Inbox view</p>
          <p className="text-sm text-gray-500 mb-3">Switch between default and compact spacing.</p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={compactView}
              onChange={(e) => setCompactView(e.target.checked)}
            />
            Compact density
          </label>
        </div>

        <div className="border rounded-xl p-4">
          <p className="font-medium text-gray-800">Product tips</p>
          <p className="text-sm text-gray-500 mb-3">Show onboarding and usage hints in UI.</p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={enableTips}
              onChange={(e) => setEnableTips(e.target.checked)}
            />
            Enable tips
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;
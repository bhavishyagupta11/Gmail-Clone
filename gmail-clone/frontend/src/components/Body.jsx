import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Body = () => {
  const { user, authChecked } = useSelector((store) => store);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (authChecked && !user) {
      navigate("/login");
    }
  }, [authChecked, navigate, user]);

  if (!authChecked || !user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-[#F6F8FC]">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto pb-4 pr-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Body;
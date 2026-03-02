import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setOpen, setSelectedFolder } from "../redux/appSlice";
import {
  MdOutlineInbox,
  MdOutlineStar,
  MdOutlineSend,
  MdOutlineUpdate,
  MdOutlineReport,
} from "react-icons/md";
import { AiOutlinePlus } from "react-icons/ai";

const sidebarItems = [
  { icon: <MdOutlineInbox size={20} />, label: "Inbox", key: "inbox" },
  { icon: <MdOutlineUpdate size={20} />, label: "Updates", key: "updates" },
  { icon: <MdOutlineStar size={20} />, label: "Starred", key: "starred" },
  { icon: <MdOutlineSend size={20} />, label: "Sent", key: "sent" },
  { icon: <MdOutlineReport size={20} />, label: "Spam", key: "spam" },
];

const Sidebar = ({ isOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedFolder } = useSelector((store) => store);

  return (
    <div className={`transition-all duration-300 ${isOpen ? "w-64" : "w-16"} flex-shrink-0 pt-2`}>
      <div className={`px-2 mb-4 ${isOpen ? "" : "flex justify-center"}`}>
        <button
          onClick={() => dispatch(setOpen(true))}
          className={`flex items-center gap-4 bg-[#C2E7FF] hover:bg-[#B3DEFF] text-gray-800 rounded-2xl shadow-sm transition-all ${
            isOpen ? "px-6 py-4 w-full" : "p-4"
          }`}
        >
          <AiOutlinePlus size={24} />
          {isOpen && <span className="font-medium text-sm">Compose</span>}
        </button>
      </div>

      <nav>
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              dispatch(setSelectedFolder(item.key));
              navigate("/");
            }}
            className={`flex items-center gap-4 w-full rounded-r-full py-2 px-4 transition-colors ${
              selectedFolder === item.key ? "bg-[#D3E3FD] font-semibold" : "hover:bg-gray-200"
            } ${!isOpen ? "justify-center px-4" : ""}`}
          >
            <span className="text-gray-700">{item.icon}</span>
            {isOpen && <span className="text-sm text-gray-700 flex-1 text-left">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
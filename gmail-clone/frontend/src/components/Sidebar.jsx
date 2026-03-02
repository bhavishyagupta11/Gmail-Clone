import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setOpen } from "../redux/appSlice";
import {
  MdOutlineInbox,
  MdOutlineStar,
  MdOutlineAccessTime,
  MdOutlineSend,
  MdOutlineInsertDriveFile,
  MdOutlineExpandMore,
} from "react-icons/md";
import { AiOutlinePlus } from "react-icons/ai";

const sidebarItems = [
  { icon: <MdOutlineInbox size={20} />, label: "Inbox", count: 0 },
  { icon: <MdOutlineStar size={20} />, label: "Starred" },
  { icon: <MdOutlineAccessTime size={20} />, label: "Snoozed" },
  { icon: <MdOutlineSend size={20} />, label: "Sent" },
  { icon: <MdOutlineInsertDriveFile size={20} />, label: "Drafts" },
  { icon: <MdOutlineExpandMore size={20} />, label: "More" },
];

const Sidebar = ({ isOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = React.useState("Inbox");

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
            key={item.label}
            onClick={() => {
              setActiveItem(item.label);
              if (item.label === "Inbox") navigate("/");
            }}
            className={`flex items-center gap-4 w-full rounded-r-full py-2 px-4 transition-colors ${
              activeItem === item.label ? "bg-[#D3E3FD] font-semibold" : "hover:bg-gray-200"
            } ${!isOpen ? "justify-center px-4" : ""}`}
          >
            <span className="text-gray-700">{item.icon}</span>
            {isOpen && (
              <>
                <span className="text-sm text-gray-700 flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-sm font-semibold text-gray-700">{item.count}</span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {isOpen && (
        <div className="mt-4 px-4">
          <p className="text-sm text-gray-500 font-medium mb-2">Labels</p>
          <div className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-gray-200 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700">Work</span>
          </div>
          <div className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-gray-200 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700">Personal</span>
          </div>
          <div className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-gray-200 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700">Important</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { setAuthUser, setEmails, setSearchText, setSelectedEmail } from "../redux/appSlice";
import { FiMenu, FiSearch } from "react-icons/fi";
import { MdOutlineHelp } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { TbGridDots } from "react-icons/tb";
import api from "../lib/api";

const Navbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, searchText } = useSelector((store) => store);

  const logoutHandler = async () => {
    try {
      const res = await api.get("/user/logout");
      if (res.data.success) {
        dispatch(setAuthUser(null));
        dispatch(setEmails([]));
        dispatch(setSelectedEmail(null));
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logout failed");
    }
  };

  return (
    <div className="flex items-center justify-between px-4 h-16 bg-[#F6F8FC] sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <FiMenu size={22} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-1 ml-1">
          <img
            src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r2.png"
            alt="Gmail"
            className="h-8 object-contain"
          />
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-4">
        <div className="flex items-center bg-[#EAF1FB] rounded-2xl px-4 py-2 gap-3 hover:bg-[#E2E8F4] transition-colors">
          <FiSearch size={20} className="text-gray-600" />
          <input
            type="text"
            placeholder="Search mail"
            value={searchText}
            onChange={(e) => dispatch(setSearchText(e.target.value))}
            className="flex-1 bg-transparent outline-none text-gray-700 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <MdOutlineHelp size={22} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <IoSettingsOutline size={22} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <TbGridDots size={22} className="text-gray-600" />
        </button>
        {user && (
          <div className="relative group ml-1">
            <img
              src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.fullname}`}
              alt={user.fullname}
              className="w-9 h-9 rounded-full cursor-pointer object-cover border-2 border-transparent hover:border-blue-400 transition-all"
            />
            <div className="absolute right-0 top-11 bg-white shadow-xl rounded-2xl py-4 px-6 w-64 hidden group-hover:block z-50 border border-gray-100">
              <div className="flex flex-col items-center gap-2 pb-4 border-b">
                <img
                  src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.fullname}`}
                  alt={user.fullname}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <p className="font-semibold text-gray-800">{user.fullname}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={logoutHandler}
                className="mt-4 w-full border border-gray-300 rounded-full py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addEmail, setOpen } from "../redux/appSlice";
import { IoClose, IoExpand } from "react-icons/io5";
import { MdMinimize } from "react-icons/md";
import { BsTrash } from "react-icons/bs";
import api from "../lib/api";

const SendEmail = () => {
  const dispatch = useDispatch();
  const [input, setInput] = useState({ to: "", subject: "", message: "" });
  const [minimized, setMinimized] = useState(false);

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/email/create", input);
      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(addEmail(res.data.email));
        dispatch(setOpen(false));
        setInput({ to: "", subject: "", message: "" });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send email");
    }
  };

  return (
    <div className="bg-white rounded-t-xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between bg-[#404040] px-4 py-3 rounded-t-xl">
        <span className="text-white text-sm font-medium">New Message</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <MdMinimize size={18} />
          </button>
          <button className="text-gray-300 hover:text-white transition-colors">
            <IoExpand size={16} />
          </button>
          <button
            onClick={() => dispatch(setOpen(false))}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <IoClose size={18} />
          </button>
        </div>
      </div>

      {!minimized && (
        <form onSubmit={submitHandler}>
          <div className="border-b border-gray-200 px-4 py-2">
            <input
              type="email"
              name="to"
              value={input.to}
              onChange={changeHandler}
              placeholder="To"
              required
              className="w-full outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="border-b border-gray-200 px-4 py-2">
            <input
              type="text"
              name="subject"
              value={input.subject}
              onChange={changeHandler}
              placeholder="Subject"
              required
              className="w-full outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="px-4 py-3">
            <textarea
              name="message"
              value={input.message}
              onChange={changeHandler}
              placeholder="Write your message here..."
              required
              rows={8}
              className="w-full outline-none text-sm text-gray-700 resize-none placeholder-gray-400"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              type="submit"
              className="bg-[#0B57D0] hover:bg-[#0A4EB8] text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => dispatch(setOpen(false))}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <BsTrash size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SendEmail;
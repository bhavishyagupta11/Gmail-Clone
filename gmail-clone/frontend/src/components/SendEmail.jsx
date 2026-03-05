import React, { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addEmail, setOpen } from "../redux/appSlice";
import { IoClose, IoExpand, IoContract } from "react-icons/io5";
import { MdMinimize } from "react-icons/md";
import { BsTrash } from "react-icons/bs";
import api from "../lib/api";

const SendEmail = () => {
  const dispatch = useDispatch();
  const [input, setInput] = useState({ to: "", subject: "", message: "", category: "primary" });
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const closeCompose = () => {
    dispatch(setOpen(false));
    setMinimized(false);
    setExpanded(false);
    setSending(false);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (sending) return;

    try {
      setSending(true);
      const res = await api.post("/email/create", input);
      if (res.data.success) {
        dispatch(addEmail(res.data.email));
        dispatch(setOpen(false));
        setInput({ to: "", subject: "", message: "", category: "primary" });
        setMinimized(false);
        setExpanded(false);
        toast.success("Email queued instantly. Delivering in background.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`fixed z-40 bg-white shadow-2xl border border-gray-200 overflow-hidden transition-all duration-200 ${
        expanded
          ? "inset-8 rounded-2xl"
          : minimized
            ? "w-[420px] h-12 bottom-0 right-6 rounded-t-xl"
            : "w-[520px] h-[560px] bottom-0 right-6 rounded-t-xl"
      }`}
    >
      <div className="flex items-center justify-between bg-[#404040] px-4 py-3">
        <span className="text-white text-sm font-medium">New Message</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-gray-300 hover:text-white transition-colors"
            title="Minimize"
          >
            <MdMinimize size={18} />
          </button>
          <button
            onClick={() => {
              setExpanded(!expanded);
              setMinimized(false);
            }}
            className="text-gray-300 hover:text-white transition-colors"
            title={expanded ? "Restore" : "Expand"}
          >
            {expanded ? <IoContract size={16} /> : <IoExpand size={16} />}
          </button>
          <button onClick={closeCompose} className="text-gray-300 hover:text-white transition-colors" title="Close">
            <IoClose size={18} />
          </button>
        </div>
      </div>

      {!minimized && (
        <form onSubmit={submitHandler} className="h-[calc(100%-48px)] flex flex-col">
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

          <div className="border-b border-gray-200 px-4 py-2">
            <select
              name="category"
              value={input.category}
              onChange={changeHandler}
              className="w-full outline-none text-sm text-gray-700"
            >
              <option value="primary">Primary</option>
              <option value="updates">Updates</option>
            </select>
          </div>

          <div className="px-4 py-3 flex-1">
            <textarea
              name="message"
              value={input.message}
              onChange={changeHandler}
              placeholder="Write your message here..."
              required
              className="w-full h-full outline-none text-sm text-gray-700 resize-none placeholder-gray-400"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={sending}
              className="bg-[#0B57D0] hover:bg-[#0A4EB8] disabled:bg-blue-300 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={closeCompose}
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

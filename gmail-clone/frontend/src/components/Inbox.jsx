import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeEmail, setEmails, setSelectedEmail } from "../redux/appSlice";
import { MdOutlineRefresh, MdOutlineMoreVert, MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { RiInboxLine } from "react-icons/ri";
import api from "../lib/api";

const Inbox = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { emails, searchText, user } = useSelector((store) => store);

  const fetchEmails = useCallback(async () => {
    try {
      const res = await api.get("/email/getallemails");
      if (res.data.success) {
        dispatch(setEmails(res.data.emails));
      }
    } catch (error) {
      console.log(error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      fetchEmails();
    }
  }, [fetchEmails, user]);

  const deleteEmailHandler = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/email/${id}`);
      if (res.data.success) {
        dispatch(removeEmail(id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const filteredEmails = emails?.filter((email) => {
    if (!searchText) return true;
    return (
      email.subject?.toLowerCase().includes(searchText.toLowerCase()) ||
      email.to?.toLowerCase().includes(searchText.toLowerCase()) ||
      email.message?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 bg-white rounded-2xl mx-2 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MdOutlineCheckBoxOutlineBlank size={20} className="text-gray-600" />
        </button>
        <button onClick={fetchEmails} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MdOutlineRefresh size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MdOutlineMoreVert size={20} className="text-gray-600" />
        </button>
        <span className="ml-auto text-xs text-gray-500">{filteredEmails?.length} conversations</span>
      </div>

      {filteredEmails?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
          <RiInboxLine size={64} />
          <p className="text-lg font-medium">No emails found</p>
          <p className="text-sm">{searchText ? "Try a different search" : "Your inbox is empty"}</p>
        </div>
      ) : (
        <div>
          {filteredEmails?.map((email) => (
            <div
              key={email._id}
              onClick={() => {
                dispatch(setSelectedEmail(email));
                navigate(`/mail/${email._id}`);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 group transition-colors"
            >
              <MdOutlineCheckBoxOutlineBlank
                size={18}
                className="text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100"
              />
              <div className="flex-1 min-w-0 grid grid-cols-[200px_1fr_80px] gap-4 items-center">
                <p className="font-medium text-sm text-gray-800 truncate">{email.to}</p>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm text-gray-800 truncate max-w-[200px]">{email.subject}</span>
                  <span className="text-sm text-gray-500 truncate">- {email.message}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(email.createdAt)}</span>
                  <button
                    onClick={(e) => deleteEmailHandler(e, email._id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 transition-all px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;
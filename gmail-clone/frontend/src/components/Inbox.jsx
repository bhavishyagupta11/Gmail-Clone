import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { removeEmail, setEmails, setSelectedEmail, updateEmailInState } from "../redux/appSlice";
import {
  MdOutlineRefresh,
  MdOutlineMoreVert,
  MdOutlineCheckBoxOutlineBlank,
  MdCheckBox,
  MdOutlineStarBorder,
  MdOutlineStar,
  MdOutlineReport,
} from "react-icons/md";
import { RiInboxLine } from "react-icons/ri";
import api from "../lib/api";

const folderTitle = {
  inbox: "Inbox",
  updates: "Updates",
  starred: "Starred",
  spam: "Spam",
  sent: "Sent",
};

const Inbox = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { emails, searchText, user, selectedFolder } = useSelector((store) => store);
  const [selectedIds, setSelectedIds] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const runInboxSync = async () => {
    try {
      await api.post("/email/sync");
    } catch {
      // sync is best-effort
    }
  };

  const fetchEmails = useCallback(async (showToast = false) => {
    try {
      await runInboxSync();
      const res = await api.get("/email/getallemails");
      if (res.data.success) {
        dispatch(setEmails(res.data.emails));
        if (showToast) toast.success("Inbox refreshed");
      }
    } catch (error) {
      console.log(error);
      if (showToast) toast.error("Could not refresh inbox");
    }
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      fetchEmails();
      const timer = setInterval(() => {
        fetchEmails(false);
      }, 45000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [fetchEmails, user]);

  const updateEmail = async (id, payload) => {
    try {
      const res = await api.patch(`/email/${id}`, payload);
      if (res.data.success) {
        dispatch(updateEmailInState(res.data.email));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteEmailHandler = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/email/${id}`);
      if (res.data.success) {
        dispatch(removeEmail(id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const filteredEmails = useMemo(() => {
    const byFolder = emails.filter((email) => {
      const isInbox = email.box === "inbox";
      const isSent = email.box === "sent";

      if (selectedFolder === "inbox") return isInbox && !email.isSpam;
      if (selectedFolder === "updates") return isInbox && !email.isSpam && email.category === "updates";
      if (selectedFolder === "starred") return email.isStarred;
      if (selectedFolder === "spam") return email.isSpam;
      if (selectedFolder === "sent") return isSent && !email.isSpam;
      return isInbox;
    });

    return byFolder.filter((email) => {
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      return (
        email.subject?.toLowerCase().includes(q) ||
        email.to?.toLowerCase().includes(q) ||
        email.from?.toLowerCase().includes(q) ||
        email.message?.toLowerCase().includes(q)
      );
    });
  }, [emails, searchText, selectedFolder]);

  const selectedAll = filteredEmails.length > 0 && selectedIds.length === filteredEmails.length;

  const toggleSelectAll = () => {
    if (selectedAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmails.map((email) => email._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const applyBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      toast("Select at least one mail");
      setMenuOpen(false);
      return;
    }

    try {
      if (action === "delete") {
        await Promise.all(selectedIds.map((id) => api.delete(`/email/${id}`)));
        selectedIds.forEach((id) => dispatch(removeEmail(id)));
        toast.success("Selected emails deleted");
      } else if (action === "star") {
        await Promise.all(
          selectedIds.map(async (id) => {
            const res = await api.patch(`/email/${id}`, { isStarred: true });
            if (res.data.success) dispatch(updateEmailInState(res.data.email));
          })
        );
        toast.success("Selected emails starred");
      } else if (action === "spam") {
        await Promise.all(
          selectedIds.map(async (id) => {
            const res = await api.patch(`/email/${id}`, { isSpam: true });
            if (res.data.success) dispatch(updateEmailInState(res.data.email));
          })
        );
        toast.success("Selected emails moved to spam");
      } else if (action === "notspam") {
        await Promise.all(
          selectedIds.map(async (id) => {
            const res = await api.patch(`/email/${id}`, { isSpam: false });
            if (res.data.success) dispatch(updateEmailInState(res.data.email));
          })
        );
        toast.success("Selected emails moved from spam");
      }
    } catch (error) {
      toast.error("Bulk action failed");
      console.log(error);
    } finally {
      setSelectedIds([]);
      setMenuOpen(false);
    }
  };


  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 bg-white rounded-2xl mx-2 overflow-visible">
      <div ref={menuRef} className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 relative z-20 bg-white rounded-t-2xl">
        <button onClick={toggleSelectAll} className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Select all">
          {selectedAll ? <MdCheckBox size={20} className="text-blue-600" /> : <MdOutlineCheckBoxOutlineBlank size={20} className="text-gray-600" />}
        </button>
        <button onClick={() => fetchEmails(true)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Reload">
          <MdOutlineRefresh size={20} className="text-gray-600" />
        </button>
        <button onClick={() => setMenuOpen((prev) => !prev)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="More actions">
          <MdOutlineMoreVert size={20} className="text-gray-600" />
        </button>

        {menuOpen && (
          <div className="absolute left-16 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-52 py-1">
            <button onClick={() => applyBulkAction("star")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Star selected</button>
            <button onClick={() => applyBulkAction("spam")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Mark spam</button>
            <button onClick={() => applyBulkAction("notspam")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Mark not spam</button>
            <button onClick={() => applyBulkAction("delete")} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete selected</button>
          </div>
        )}

        <span className="ml-2 text-sm font-medium text-gray-700">{folderTitle[selectedFolder] || "Inbox"}</span>
        <span className="ml-auto text-xs text-gray-500">{filteredEmails.length} conversations</span>
      </div>

      {filteredEmails.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
          <RiInboxLine size={64} />
          <p className="text-lg font-medium">No emails found</p>
          <p className="text-sm">{searchText ? "Try a different search" : "Nothing in this folder yet"}</p>
        </div>
      ) : (
        <div>
          {filteredEmails.map((email) => {
            const counterparty = email.box === "sent" ? email.to : email.from;
            const isSelected = selectedIds.includes(email._id);
            const isUnread = email.box === "inbox" && !email.isRead;
            return (
              <div
                key={email._id}
                onClick={() => {
                  dispatch(setSelectedEmail(email));
                  navigate(`/mail/${email._id}`);
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 group transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectOne(email._id);
                  }}
                  className="text-gray-500"
                >
                  {isSelected ? <MdCheckBox size={18} className="text-blue-600" /> : <MdOutlineCheckBoxOutlineBlank size={18} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateEmail(email._id, { isStarred: !email.isStarred });
                  }}
                  className="text-gray-400 hover:text-yellow-500"
                  title="Toggle star"
                >
                  {email.isStarred ? (
                    <MdOutlineStar size={18} className="text-yellow-500" />
                  ) : (
                    <MdOutlineStarBorder size={18} />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateEmail(email._id, { isSpam: !email.isSpam });
                  }}
                  className={`hover:text-red-600 ${email.isSpam ? "text-red-500" : "text-gray-400"}`}
                  title="Toggle spam"
                >
                  <MdOutlineReport size={18} />
                </button>
                {isUnread ? <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread" /> : <span className="w-2 h-2" />}
                <div className="flex-1 min-w-0 grid grid-cols-[180px_1fr_90px] gap-4 items-center">
                  <p className={`text-sm truncate ${isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>{counterparty}</p>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-sm truncate max-w-[220px] ${isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>{email.subject}</span>
                    <span className="text-sm text-gray-500 truncate">- {email.message}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`text-xs whitespace-nowrap ${isUnread ? "font-semibold text-gray-700" : "text-gray-500"}`}>{formatDate(email.createdAt)}</span>
                    <button
                      onClick={(e) => deleteEmailHandler(e, email._id)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 transition-all px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inbox;



import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { removeEmail, setSelectedEmail, updateEmailInState } from "../redux/appSlice";
import { IoArrowBack } from "react-icons/io5";
import { MdOutlineDelete, MdOutlineArchive, MdOutlineMarkEmailUnread } from "react-icons/md";
import { HiOutlinePrinter } from "react-icons/hi";
import { BsThreeDotsVertical } from "react-icons/bs";
import api from "../lib/api";

const Mail = () => {
  const { id } = useParams();
  const { selectedEmail, user } = useSelector((store) => store);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState(selectedEmail && selectedEmail._id === id ? selectedEmail : null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchEmail = async () => {
      try {
        const res = await api.get(`/email/${id}`);
        if (active && res.data.success) {
          setEmail(res.data.email);
          dispatch(setSelectedEmail(res.data.email));
          dispatch(updateEmailInState(res.data.email));
        }
      } catch {
        if (active) {
          navigate("/");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchEmail();

    return () => {
      active = false;
    };
  }, [dispatch, id, navigate]);

  const deleteEmailHandler = async () => {
    try {
      const res = await api.delete(`/email/${id}`);
      if (res.data.success) {
        dispatch(removeEmail(id));
        dispatch(setSelectedEmail(null));
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || !email) {
    return <div className="flex-1 bg-white rounded-2xl mx-2" />;
  }

  const isSent = email.box === "sent";
  const topLabel = isSent ? "to" : "from";
  const topAddress = isSent ? email.to : email.from;

  return (
    <div className="flex-1 bg-white rounded-2xl mx-2 overflow-y-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => {
            dispatch(setSelectedEmail(null));
            navigate("/");
          }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <IoArrowBack size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MdOutlineArchive size={20} className="text-gray-600" />
        </button>
        <button onClick={deleteEmailHandler} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MdOutlineDelete size={20} className="text-gray-600" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={async () => {
            const res = await api.patch(`/email/${id}`, { isRead: false });
            if (res.data.success) {
              dispatch(updateEmailInState(res.data.email));
              setEmail(res.data.email);
            }
          }}
          title="Mark as unread"
        >
          <MdOutlineMarkEmailUnread size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-auto">
          <HiOutlinePrinter size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <BsThreeDotsVertical size={18} className="text-gray-600" />
        </button>
      </div>

      <div className="px-8 py-6">
        <h1 className="text-2xl font-normal text-gray-800 mb-6">{email.subject}</h1>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {(topAddress || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{topAddress}</span>
              </div>
              <div className="text-sm text-gray-500">
                {topLabel}: <span className="text-gray-700">{topAddress}</span>
              </div>
              <div className="text-sm text-gray-500">
                {isSent ? "from" : "to"}: <span className="text-gray-700">{isSent ? email.from : email.to}</span>
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap mt-1">{formatDate(email.createdAt)}</span>
        </div>

        <div className="border-t border-gray-100 mb-6" />

        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{email.message}</div>
      </div>
    </div>
  );
};

export default Mail;
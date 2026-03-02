import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../lib/api";

const Signup = () => {
  const [input, setInput] = useState({ fullname: "", email: "", password: "" });
  const navigate = useNavigate();
  const { user, authChecked } = useSelector((store) => store);

  useEffect(() => {
    if (authChecked && user) {
      navigate("/");
    }
  }, [authChecked, navigate, user]);

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/user/register", input);
      if (res.data.success) {
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F6F8FC]">
      <div className="bg-white rounded-3xl shadow-md p-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r2.png"
            alt="Gmail"
            className="h-10 mb-4 object-contain"
          />
          <h1 className="text-2xl font-normal text-gray-800">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">to continue to Gmail</p>
        </div>

        <form onSubmit={submitHandler} className="flex flex-col gap-4">
          <input
            type="text"
            name="fullname"
            value={input.fullname}
            onChange={changeHandler}
            placeholder="Full name"
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          <input
            type="email"
            name="email"
            value={input.email}
            onChange={changeHandler}
            placeholder="Email"
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          <input
            type="password"
            name="password"
            value={input.password}
            onChange={changeHandler}
            placeholder="Password"
            required
            minLength={6}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />

          <div className="flex items-center justify-between mt-2">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Sign in instead
            </Link>
            <button
              type="submit"
              className="bg-[#0B57D0] hover:bg-[#0A4EB8] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
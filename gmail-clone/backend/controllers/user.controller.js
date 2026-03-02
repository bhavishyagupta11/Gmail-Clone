import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isMongoConnected } from "../db/connectDB.js";
import { createUser, findUserByEmail, findUserById } from "../db/localStore.js";

const getJwtSecret = () => process.env.SECRET_KEY || "dev_secret_key_change_me";

const sanitizeUser = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  profilePhoto: user.profilePhoto,
});

const applyAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required.", success: false });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = isMongoConnected()
      ? await User.findOne({ email: normalizedEmail })
      : await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered.", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=random`;

    if (isMongoConnected()) {
      await User.create({
        fullname,
        email: normalizedEmail,
        password: hashedPassword,
        profilePhoto,
      });
    } else {
      await createUser({
        fullname,
        email: normalizedEmail,
        password: hashedPassword,
        profilePhoto,
      });
    }

    return res.status(201).json({ message: "Account created successfully.", success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required.", success: false });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = isMongoConnected()
      ? await User.findOne({ email: normalizedEmail })
      : await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password.", success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password.", success: false });
    }

    const token = jwt.sign({ userId: String(user._id) }, getJwtSecret(), { expiresIn: "7d" });
    applyAuthCookie(res, token);

    return res.status(200).json({
      message: `Welcome back, ${user.fullname}!`,
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = isMongoConnected()
      ? await User.findById(req.id).select("_id fullname email profilePhoto")
      : await findUserById(req.id);

    if (!user) {
      res.clearCookie("token");
      return res.status(404).json({ message: "User not found.", success: false });
    }

    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ message: "Logged out successfully.", success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};
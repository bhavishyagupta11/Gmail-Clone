import express from "express";
import { getCurrentUser, login, logout, register, updateProfilePhoto } from "../controllers/user.controller.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/me").get(isAuthenticated, getCurrentUser);
router.route("/profile-photo").patch(isAuthenticated, updateProfilePhoto);
router.route("/logout").get(logout);

export default router;
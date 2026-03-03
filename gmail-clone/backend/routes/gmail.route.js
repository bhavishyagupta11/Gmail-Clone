import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { disconnectGmail, getGmailConnectUrl, gmailCallback, gmailStatus } from "../controllers/gmail.controller.js";

const router = express.Router();

router.route("/status").get(isAuthenticated, gmailStatus);
router.route("/connect-url").get(isAuthenticated, getGmailConnectUrl);
router.route("/disconnect").post(isAuthenticated, disconnectGmail);
router.route("/callback").get(gmailCallback);

export default router;

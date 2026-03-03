import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { findUserById, updateUserById } from "../db/localStore.js";
import { isMongoConnected } from "../db/connectDB.js";
import { buildGoogleConnectUrl, exchangeCodeForTokens, isGmailConfigured } from "../services/gmail.service.js";

const getJwtSecret = () => process.env.SECRET_KEY || "dev_secret_key_change_me";

const getClientUrl = () => {
  const value = process.env.CLIENT_URL || "http://localhost:5173";
  return value.split(",")[0].trim();
};

const getUserById = async (id) => {
  if (isMongoConnected()) {
    return User.findById(id);
  }
  return findUserById(id);
};

const updateUserGmail = async ({ userId, gmail }) => {
  if (isMongoConnected()) {
    return User.findByIdAndUpdate(userId, { gmail }, { new: true });
  }
  return updateUserById({ userId, updates: { gmail } });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  profilePhoto: user.profilePhoto,
  gmailConnected: Boolean(user?.gmail?.refreshToken),
  gmailConnectedEmail: user?.gmail?.connectedEmail || null,
});

const buildStateToken = (userId) =>
  jwt.sign({ userId: String(userId), type: "gmail_connect" }, getJwtSecret(), { expiresIn: "10m" });

const verifyStateToken = (token) => jwt.verify(token, getJwtSecret());

export const gmailStatus = async (req, res) => {
  try {
    const user = await getUserById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      configured: isGmailConfigured(),
      gmailConnected: Boolean(user?.gmail?.refreshToken),
      gmailConnectedEmail: user?.gmail?.connectedEmail || null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getGmailConnectUrl = async (req, res) => {
  try {
    if (!isGmailConfigured()) {
      return res.status(400).json({
        success: false,
        message: "Google OAuth env is missing. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.",
      });
    }

    const state = buildStateToken(req.id);
    const url = buildGoogleConnectUrl({ state });

    return res.status(200).json({ success: true, url });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Could not start Gmail connect." });
  }
};

export const gmailCallback = async (req, res) => {
  const redirectBase = `${getClientUrl()}/settings`;

  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${redirectBase}?gmail=error&reason=missing_code_or_state`);
    }

    const payload = verifyStateToken(state);
    if (payload?.type !== "gmail_connect" || !payload?.userId) {
      return res.redirect(`${redirectBase}?gmail=error&reason=invalid_state`);
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return res.redirect(`${redirectBase}?gmail=error&reason=user_not_found`);
    }

    const tokens = await exchangeCodeForTokens({ code });

    await updateUserGmail({
      userId: payload.userId,
      gmail: {
        connectedEmail: tokens.connectedEmail,
        refreshToken: tokens.refreshToken || user?.gmail?.refreshToken || null,
        accessToken: tokens.accessToken,
        tokenExpiryDate: tokens.tokenExpiryDate,
        scope: tokens.scope,
      },
    });

    return res.redirect(`${redirectBase}?gmail=connected`);
  } catch (error) {
    console.log(error);
    return res.redirect(`${redirectBase}?gmail=error&reason=oauth_failed`);
  }
};

export const disconnectGmail = async (req, res) => {
  try {
    const user = await getUserById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const updatedUser = await updateUserGmail({
      userId: req.id,
      gmail: {
        connectedEmail: null,
        refreshToken: null,
        accessToken: null,
        tokenExpiryDate: null,
        scope: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Gmail disconnected.",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Could not disconnect Gmail." });
  }
};

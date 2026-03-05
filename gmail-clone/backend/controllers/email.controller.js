import { Email } from "../models/email.model.js";
import mongoose from "mongoose";
import { isMongoConnected } from "../db/connectDB.js";
import {
  createEmail as createLocalEmail,
  deleteEmailByIdForUser,
  findUserByEmail,
  findUserById,
  getEmailByIdForUser,
  getEmailsByUserId,
  updateEmailByIdForUser,
  updateUserById,
} from "../db/localStore.js";
import { User } from "../models/user.model.js";
import { sendEmailViaSmtp } from "../services/mailer.js";
import { syncIncomingForUser } from "../services/inboxSync.js";
import { applyGmailMessageUpdates, sendViaGmail, trashGmailMessage } from "../services/gmail.service.js";

const normalizeCategory = (value) => (value === "updates" ? "updates" : "primary");

const getUserById = async (id) => {
  if (isMongoConnected()) {
    return User.findById(id);
  }
  return findUserById(id);
};

const getUserByEmail = async (email) => {
  if (isMongoConnected()) {
    return User.findOne({ email });
  }
  return findUserByEmail(email);
};

const persistUserGmailTokens = async ({ user, tokens }) => {
  const nextGmail = {
    connectedEmail: user?.gmail?.connectedEmail || null,
    refreshToken: tokens.refreshToken || user?.gmail?.refreshToken || null,
    accessToken: tokens.accessToken || user?.gmail?.accessToken || null,
    tokenExpiryDate: tokens.tokenExpiryDate || user?.gmail?.tokenExpiryDate || null,
    scope: tokens.scope || user?.gmail?.scope || null,
  };

  if (isMongoConnected()) {
    await User.findByIdAndUpdate(user._id, { gmail: nextGmail });
  } else {
    await updateUserById({ userId: String(user._id), updates: { gmail: nextGmail } });
  }
};

const isGmailLinkedEmail = (email) => email?.externalSource === "gmail" && Boolean(email?.externalMessageId);

export const syncInbox = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(400).json({ success: false, message: "Sync requires Mongo mode." });
    }

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const result = await syncIncomingForUser({
      user,
      persistTokens: (tokens) => persistUserGmailTokens({ user, tokens }),
    });

    if (result.reason && result.imported === 0) {
      return res.status(200).json({ success: true, imported: 0, message: result.reason });
    }

    return res.status(200).json({ success: true, imported: result.imported, details: result.details || null, message: "Inbox synced." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Sync failed." });
  }
};

export const createEmail = async (req, res) => {
  try {
    const { to, subject, message, category } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "All fields are required.", success: false });
    }

    const sender = await getUserById(req.id);
    if (!sender) {
      return res.status(401).json({ message: "User not found.", success: false });
    }

    const toEmail = to.trim().toLowerCase();
    const subjectText = subject.trim();
    const messageText = message.trim();
    const categoryValue = normalizeCategory(category);

    const sentPayload = {
      from: sender.email,
      to: toEmail,
      subject: subjectText,
      message: messageText,
      category: categoryValue,
      box: "sent",
      isRead: true,
      userId: req.id,
      externalSource: "local",
      externalMessageId: null,
    };

    const recipientUser = await getUserByEmail(toEmail);
    const shouldCreateInboxCopy = Boolean(recipientUser);

    let senderEmail = null;

    if (isMongoConnected()) {
      senderEmail = await Email.create(sentPayload);

      if (shouldCreateInboxCopy) {
        await Email.create({
          ...sentPayload,
          box: "inbox",
          isRead: false,
          externalSource: "local",
          externalMessageId: null,
          userId: recipientUser._id,
        });
      }
    } else {
      senderEmail = await createLocalEmail(sentPayload);

      if (shouldCreateInboxCopy) {
        await createLocalEmail({
          ...sentPayload,
          box: "inbox",
          isRead: false,
          externalSource: "local",
          externalMessageId: null,
          userId: String(recipientUser._id),
        });
      }
    }

    res.status(201).json({
      message: "Email queued successfully.",
      success: true,
      email: senderEmail,
      deliveredToAppInbox: shouldCreateInboxCopy,
      deliveredToSmtp: null,
      smtpInfo: "Delivery in progress.",
    });

    (async () => {
      try {
        if (isMongoConnected() && sender?.gmail?.refreshToken) {
          const gmailDelivery = await sendViaGmail({
            user: sender,
            to: toEmail,
            subject: subjectText,
            message: messageText,
            persistTokens: (tokens) => persistUserGmailTokens({ user: sender, tokens }),
          });

          if (gmailDelivery?.externalMessageId) {
            await Email.findByIdAndUpdate(senderEmail._id, {
              externalSource: "gmail",
              externalMessageId: gmailDelivery.externalMessageId,
              from: gmailDelivery.from || sender.email,
            });
          }
          return;
        }

        await sendEmailViaSmtp({
          from: sender.email,
          to: toEmail,
          subject: subjectText,
          message: messageText,
        });
      } catch (deliveryError) {
        console.error("Background delivery failed:", deliveryError?.message || deliveryError);
      }
    })();

    return undefined;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

export const getAllEmailById = async (req, res) => {
  try {
    const emails = isMongoConnected()
      ? await Email.find({ userId: req.id }).sort({ createdAt: -1 })
      : await getEmailsByUserId(req.id);

    return res.status(200).json({ emails, success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

export const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;

    let email = null;

    if (isMongoConnected()) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "Email not found.", success: false });
      }

      email = await Email.findOne({ _id: id, userId: req.id });
      if (email && email.box === "inbox" && !email.isRead) {
        email.isRead = true;

        if (isGmailLinkedEmail(email)) {
          const user = await User.findById(req.id);
          if (user?.gmail?.refreshToken) {
            try {
              await applyGmailMessageUpdates({
                user,
                messageId: email.externalMessageId,
                updates: { isRead: true },
                persistTokens: (tokens) => persistUserGmailTokens({ user, tokens }),
              });
            } catch (gmailError) {
              console.error("Gmail read sync failed:", gmailError?.message || gmailError);
            }
          }
        }

        await email.save();
      }
    } else {
      email = await getEmailByIdForUser({ emailId: id, userId: req.id });
      if (email && email.box === "inbox" && !email.isRead) {
        email = await updateEmailByIdForUser({ emailId: id, userId: req.id, updates: { isRead: true } });
      }
    }

    if (!email) {
      return res.status(404).json({ message: "Email not found.", success: false });
    }

    return res.status(200).json({ success: true, email });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

export const updateEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { isStarred, isSpam, category, isRead } = req.body;

    const updates = {};
    if (typeof isStarred === "boolean") {
      updates.isStarred = isStarred;
    }
    if (typeof isSpam === "boolean") {
      updates.isSpam = isSpam;
    }
    if (typeof isRead === "boolean") {
      updates.isRead = isRead;
    }
    if (typeof category === "string") {
      updates.category = normalizeCategory(category);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid updates provided.", success: false });
    }

    let existingEmail = null;

    if (isMongoConnected()) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "Email not found.", success: false });
      }
      existingEmail = await Email.findOne({ _id: id, userId: req.id });
    } else {
      existingEmail = await getEmailByIdForUser({ emailId: id, userId: req.id });
    }

    if (!existingEmail) {
      return res.status(404).json({ message: "Email not found.", success: false });
    }

    if (isMongoConnected() && isGmailLinkedEmail(existingEmail)) {
      const user = await User.findById(req.id);
      if (user?.gmail?.refreshToken) {
        try {
          await applyGmailMessageUpdates({
            user,
            messageId: existingEmail.externalMessageId,
            updates,
            persistTokens: (tokens) => persistUserGmailTokens({ user, tokens }),
          });
        } catch (gmailError) {
          console.error("Gmail message update failed:", gmailError?.message || gmailError);
        }
      }
    }

    let email = null;

    if (isMongoConnected()) {
      email = await Email.findOneAndUpdate({ _id: id, userId: req.id }, updates, {
        new: true,
      });
    } else {
      email = await updateEmailByIdForUser({ emailId: id, userId: req.id, updates });
    }

    if (!email) {
      return res.status(404).json({ message: "Email not found.", success: false });
    }

    return res.status(200).json({ success: true, email, message: "Email updated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

export const deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;

    let existingEmail = null;

    if (isMongoConnected()) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "Email not found.", success: false });
      }
      existingEmail = await Email.findOne({ _id: id, userId: req.id });
    } else {
      existingEmail = await getEmailByIdForUser({ emailId: id, userId: req.id });
    }

    if (!existingEmail) {
      return res.status(404).json({ message: "Email not found.", success: false });
    }

    if (isMongoConnected() && isGmailLinkedEmail(existingEmail)) {
      const user = await User.findById(req.id);
      if (user?.gmail?.refreshToken) {
        try {
          await trashGmailMessage({
            user,
            messageId: existingEmail.externalMessageId,
            persistTokens: (tokens) => persistUserGmailTokens({ user, tokens }),
          });
        } catch (gmailError) {
          console.error("Gmail trash failed:", gmailError?.message || gmailError);
        }
      }
    }

    let deletedEmail = null;

    if (isMongoConnected()) {
      deletedEmail = await Email.findOneAndDelete({ _id: id, userId: req.id });
    } else {
      deletedEmail = await deleteEmailByIdForUser({ emailId: id, userId: req.id });
    }

    if (!deletedEmail) {
      return res.status(404).json({ message: "Email not found.", success: false });
    }

    return res.status(200).json({ message: "Email deleted successfully.", success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};



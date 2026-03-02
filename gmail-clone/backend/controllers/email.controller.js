import { Email } from "../models/email.model.js";
import mongoose from "mongoose";
import { isMongoConnected } from "../db/connectDB.js";
import {
  createEmail as createLocalEmail,
  deleteEmailByIdForUser,
  getEmailByIdForUser,
  getEmailsByUserId,
} from "../db/localStore.js";

export const createEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "All fields are required.", success: false });
    }

    const emailPayload = {
      to: to.trim(),
      subject: subject.trim(),
      message: message.trim(),
      userId: req.id,
    };

    const email = isMongoConnected()
      ? await Email.create(emailPayload)
      : await createLocalEmail(emailPayload);

    return res.status(201).json({ message: "Email sent successfully.", success: true, email });
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
    } else {
      email = await getEmailByIdForUser({ emailId: id, userId: req.id });
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

export const deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;

    let deletedEmail = null;

    if (isMongoConnected()) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "Email not found.", success: false });
      }

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
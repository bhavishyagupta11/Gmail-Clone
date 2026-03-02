import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    box: {
      type: String,
      enum: ["inbox", "sent"],
      default: "inbox",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isSpam: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ["primary", "updates"],
      default: "primary",
    },
    externalMessageId: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Email = mongoose.model("Email", emailSchema);
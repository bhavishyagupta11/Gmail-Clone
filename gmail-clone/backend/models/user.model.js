import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    gmail: {
      connectedEmail: {
        type: String,
        default: null,
      },
      refreshToken: {
        type: String,
        default: null,
      },
      accessToken: {
        type: String,
        default: null,
      },
      tokenExpiryDate: {
        type: Number,
        default: null,
      },
      scope: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

import express from "express";
import {
  createEmail,
  deleteEmail,
  getAllEmailById,
  getEmailById,
  syncInbox,
  updateEmail,
} from "../controllers/email.controller.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

router.route("/create").post(isAuthenticated, createEmail);
router.route("/sync").post(isAuthenticated, syncInbox);
router.route("/getallemails").get(isAuthenticated, getAllEmailById);
router.route("/:id").get(isAuthenticated, getEmailById).patch(isAuthenticated, updateEmail).delete(isAuthenticated, deleteEmail);

export default router;
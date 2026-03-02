import express from "express";
import {
  createEmail,
  deleteEmail,
  getAllEmailById,
  getEmailById,
} from "../controllers/email.controller.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

router.route("/create").post(isAuthenticated, createEmail);
router.route("/getallemails").get(isAuthenticated, getAllEmailById);
router.route("/:id").get(isAuthenticated, getEmailById).delete(isAuthenticated, deleteEmail);

export default router;
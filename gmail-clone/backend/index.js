import express from "express";
import dotenv from "dotenv";
import connectDB, { isMongoConnected } from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/user.route.js";
import emailRoute from "./routes/email.route.js";

dotenv.config({});

const PORT = process.env.PORT || 8080;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    success: true,
    storage: isMongoConnected() ? "mongo" : "local",
  });
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/email", emailRoute);

const bootstrap = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  });
};

bootstrap();
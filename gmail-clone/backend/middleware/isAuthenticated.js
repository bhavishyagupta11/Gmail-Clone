import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.SECRET_KEY || "dev_secret_key_change_me";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "User not authenticated.", success: false });
    }

    const decode = jwt.verify(token, getJwtSecret());
    req.id = decode.userId;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token.", success: false });
  }
};

export default isAuthenticated;
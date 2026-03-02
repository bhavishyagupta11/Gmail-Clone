import mongoose from "mongoose";

export const isMongoConnected = () => mongoose.connection.readyState === 1;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log("MONGO_URI not set. Using local JSON datastore.");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully.");
    return true;
  } catch (error) {
    console.log("MongoDB connection failed. Falling back to local datastore.");
    console.log(error.message);
    return false;
  }
};

export default connectDB;
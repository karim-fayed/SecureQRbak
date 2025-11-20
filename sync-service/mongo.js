import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // لتحميل .env

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    throw new Error("MONGODB_URI not defined in .env");
}

export const connectMongo = async () => {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    return mongoose;
};

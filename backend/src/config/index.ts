import dotenv from "dotenv";
import mongoose from "mongoose";
import { Redis } from "ioredis";

dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI || "";
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const PORT = process.env.PORT || 4000;
export const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";

const redisUrl = new URL(REDIS_URL);

const parsedRedisDb = Number(redisUrl.pathname.replace("/", ""));

export const bullMqConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  ...(redisUrl.username ? { username: redisUrl.username } : {}),
  ...(redisUrl.password ? { password: redisUrl.password } : {}),
  ...(Number.isNaN(parsedRedisDb) ? {} : { db: parsedRedisDb }),
  ...(redisUrl.protocol === "rediss:" ? { tls: {} } : {}),
  maxRetriesPerRequest: null,
};

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on("error", (err) => {
  console.error("Redis error", err);
});

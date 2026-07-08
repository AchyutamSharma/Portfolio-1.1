import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";

export const mongoClient = uri
  ? new MongoClient(uri, { serverSelectionTimeoutMS: 2000 })
  : null;

export const connectMongo = async () => {
  if (!mongoClient) return null;

  try {
    await mongoClient.connect();
    console.log("✅ MongoDB Connected");
    return mongoClient.db(process.env.MONGODB_DB_NAME || "portfolio");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error);
    return null;
  }
};


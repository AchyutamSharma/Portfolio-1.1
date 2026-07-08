/* global process */
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { portfolioData } from "../frontend/src/data.js";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Configure CORS dynamically from environment so deployed frontends can be allowed
const rawFrontendUrls = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173");
const frontendOrigins = rawFrontendUrls
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

console.log('Allowed frontend origins:', frontendOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl/postman)
      if (!origin) return callback(null, true);
      if (frontendOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: This origin is not allowed'), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  })
);

// Ensure preflight requests are handled
app.options('*', cors());

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "portfolio";
let isMongoAvailable = false;
let mongoDb = null;
let mongoClient = null;

const initDb = async () => {
  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB_NAME);
    await mongoDb.collection("contact_messages").createIndex({ received_at: -1 });
    await mongoDb.collection("file_details").createIndex({ created_at: -1 });
    isMongoAvailable = true;
    console.log(`✅ MongoDB Connected to ${MONGODB_URI}`);
  } catch (error) {
    isMongoAvailable = false;
    console.warn("⚠️ MongoDB connection failed. Real-time updates will not be persisted until the database is reachable.");
    console.warn(error.message);
  }
};

const maskSecret = (value) => {
  if (!value) return "";
  if (value.length <= 2) return "*".repeat(value.length);
  return `${value[0]}${"*".repeat(value.length - 2)}${value.slice(-1)}`;
};

let currentAdminPassword = process.env.ADMIN_PASSWORD || "AKS";
const messages = [];
let portfolioCache = JSON.parse(JSON.stringify(portfolioData));

const insertContactMessageToDb = async (payload) => {
  if (!isMongoAvailable || !mongoDb) {
    return { rows: null, error: new Error("MongoDB unavailable") };
  }

  try {
    const result = await mongoDb.collection("contact_messages").insertOne({
      id: payload.id,
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      received_at: payload.received_at,
    });
    return { rows: [{ id: result.insertedId.toString() }], error: null };
  } catch (error) {
    return { rows: null, error };
  }
};

const fetchContactMessagesFromDb = async () => {
  if (!isMongoAvailable || !mongoDb) {
    return { data: null, error: new Error("MongoDB unavailable") };
  }

  try {
    const documents = await mongoDb.collection("contact_messages").find({}).sort({ received_at: -1 }).toArray();
    return { data: documents, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

const saveFileDetailsToDb = async (details) => {
  if (!isMongoAvailable || !mongoDb) {
    return { rows: null, error: new Error("MongoDB unavailable") };
  }

  try {
    const result = await mongoDb.collection("file_details").insertOne({
      path: details.path,
      name: details.name,
      type: details.type || null,
      size: details.size || null,
      content: details.content || null,
      metadata: details.metadata || null,
      created_at: new Date(),
    });
    return { rows: [{ id: result.insertedId.toString() }], error: null };
  } catch (error) {
    return { rows: null, error };
  }
};

const fetchFileDetailsFromDb = async () => {
  if (!isMongoAvailable || !mongoDb) {
    return { data: null, error: new Error("MongoDB unavailable") };
  }

  try {
    const documents = await mongoDb.collection("file_details").find({}).sort({ created_at: -1 }).toArray();
    return { data: documents, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

const deleteContactMessageFromDb = async (messageId) => {
  if (!isMongoAvailable || !mongoDb) {
    return { error: new Error("MongoDB unavailable") };
  }

  try {
    await mongoDb.collection("contact_messages").deleteOne({ id: messageId });
    return { error: null };
  } catch (error) {
    return { error };
  }
};

const fetchPortfolioFromDb = async () => {
  if (!isMongoAvailable || !mongoDb) {
    return { data: null, error: new Error("MongoDB unavailable") };
  }

  try {
    const document = await mongoDb.collection("portfolio").findOne({ _id: "portfolio" });
    return { data: document?.data ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

const savePortfolioToDb = async (data) => {
  portfolioCache = data;

  if (!isMongoAvailable || !mongoDb) {
    return { error: new Error("MongoDB unavailable") };
  }

  try {
    await mongoDb.collection("portfolio").updateOne(
      { _id: "portfolio" },
      { $set: { data, updated_at: new Date() } },
      { upsert: true },
    );
    return { error: null };
  } catch (error) {
    return { error };
  }
};

app.use(express.json({ limit: "10mb" }));

const csrfTokens = new Map();

const generateCsrfToken = () => crypto.randomBytes(24).toString("hex");

const createCsrfToken = () => {
  const token = generateCsrfToken();
  const ttl = Date.now() + 10 * 60 * 1000;
  csrfTokens.set(token, ttl);
  return token;
};

const cleanExpiredCsrfTokens = () => {
  const now = Date.now();
  for (const [token, expiresAt] of csrfTokens.entries()) {
    if (expiresAt <= now) {
      csrfTokens.delete(token);
    }
  }
};

const csrfProtection = (req, res, next) => {
  if (req.method === "GET") {
    return next();
  }

  const exemptPaths = ["/api/csrf-token", "/api/admin/auth", "/api/admin/change-password"];
  if (exemptPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  if (req.method === "POST" && req.path === "/api/chat") {
    const headerToken = req.header("x-csrf-token");
    cleanExpiredCsrfTokens();

    if (!headerToken || !csrfTokens.has(headerToken)) {
      return res.status(403).json({ success: false, message: "Invalid CSRF token" });
    }

    csrfTokens.delete(headerToken);
  }

  return next();
};

app.use(csrfProtection);

app.post("/api/admin/auth", async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "Password is required" });
  }

  const isValid = password === currentAdminPassword;
  console.log(
    `Admin authentication attempt details: Success=${isValid}, Time=${new Date().toISOString()}, IP=${req.ip}`,
  );

  if (!isValid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid password" });
  }

  return res.json({ success: true, message: "Authenticated successfully" });
});

app.post("/api/admin/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Old password and new password are required",
    });
  }

  if (oldPassword !== currentAdminPassword) {
    console.log(
      `Failed password change attempt: Incorrect current password, Time=${new Date().toISOString()}, IP=${req.ip}`,
    );

    return res
      .status(401)
      .json({ success: false, message: "Old password is incorrect" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters",
    });
  }

  currentAdminPassword = newPassword;
  console.log(
    `Admin password changed successfully: Time=${new Date().toISOString()}, IP=${req.ip}`,
  );

  return res.json({ success: true, message: "Password updated successfully" });
});

app.get("/api/admin/messages", async (req, res) => {
  if (isMongoAvailable) {
    const { data, error } = await fetchContactMessagesFromDb();
    if (!error && Array.isArray(data)) {
      const formatted = data.map((msg) => ({
        ...msg,
        receivedAt: msg.received_at,
      }));
      return res.json({ success: true, messages: formatted });
    }
    console.error("MongoDB messages fetch failed:", error);
  }

  return res.json({ success: true, messages });
});

app.delete("/api/admin/messages/:id", async (req, res) => {
  const { id } = req.params;
  const index = messages.findIndex((msg) => msg.id === id);

  if (isMongoAvailable) {
    const { error } = await deleteContactMessageFromDb(id);
    if (error) {
      console.error("MongoDB message delete failed:", error);
    }
  }

  if (index !== -1) {
    messages.splice(index, 1);
  }

  if (index === -1 && !isMongoAvailable) {
    return res.status(404).json({ success: false, message: "Message not found" });
  }

  return res.json({ success: true, message: "Message deleted successfully" });
});

const sanitizeText = (value) => {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
};

const sanitizeEmail = (value) => {
  if (typeof value !== "string") return "";
  return value.replace(/[\s<>"'\\]/g, "").trim();
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

app.post("/api/contact", async (req, res) => {
  const name = sanitizeText(req.body.name);
  const email = sanitizeEmail(req.body.email);
  const subject = sanitizeText(req.body.subject);
  const message = sanitizeText(req.body.message);

  if (!name || !email || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Provide a valid email address" });
  }

  if (name.length > 100 || subject.length > 120 || message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "One or more fields exceed supported length",
    });
  }

  const contactMessage = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    email,
    subject,
    message,
    receivedAt: new Date().toISOString(),
  };

  messages.unshift(contactMessage);

  if (isMongoAvailable) {
    const { error } = await insertContactMessageToDb({
      id: contactMessage.id,
      name,
      email,
      subject,
      message,
      received_at: contactMessage.receivedAt,
    });

    if (error) {
      console.error("MongoDB contact insert failed:", error);
    }
  }

  console.log(
    `Received contact message:\n  Name: ${name}\n  Email: ${email}\n  Subject: ${subject}\n  Message: ${message}`,
  );

  return res.json({ success: true, message: "Message received successfully!" });
});


app.post("/api/files", async (req, res) => {
  const { path, name } = req.body || {};
  if (!path || !name) {
    return res.status(400).json({ success: false, message: "Path and name are required" });
  }

  const { error } = await saveFileDetailsToDb(req.body);
  if (error) {
    console.error("MongoDB file save failed:", error);
    return res.status(500).json({ success: false, message: "Unable to store file details" });
  }

  return res.json({ success: true, message: "File details stored successfully" });
});

app.get("/api/files", async (req, res) => {
  const { data, error } = await fetchFileDetailsFromDb();
  if (error) {
    console.error("MongoDB file fetch failed:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch file details" });
  }

  return res.json({ success: true, files: data });
});

app.get("/api/portfolio", async (req, res) => {
  const { data, error } = await fetchPortfolioFromDb();
  if (error) {
    console.error("MongoDB portfolio fetch failed:", error);
  }

  const portfolio = data || portfolioCache;
  if (data) {
    portfolioCache = data;
  }
  return res.json({ success: true, portfolio });
});

app.post("/api/portfolio", async (req, res) => {
  const portfolio = req.body;
  if (!portfolio || typeof portfolio !== "object") {
    return res.status(400).json({ success: false, message: "Portfolio data is required" });
  }

  const { error } = await savePortfolioToDb(portfolio);
  if (error && isMongoAvailable) {
    console.error("MongoDB portfolio save failed:", error);
    return res.status(500).json({ success: false, message: "Unable to save portfolio data" });
  }

  if (error && !isMongoAvailable) {
    console.warn("MongoDB unavailable, using in-memory portfolio cache for this deployment.");
  }

  return res.json({ success: true, portfolio });
});

app.get("/api/csrf-token", (req, res) => {
  const csrfToken = createCsrfToken();
  res.json({ success: true, csrfToken });
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      message: "Message is required",
    });
  }

  const pData = portfolioData;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Gemini API key not configured",
    });
  }

  try {
    const systemInstructionText = `
You are Achyutam Sharma's AI Portfolio Assistant.

Your job is to answer questions using ONLY the portfolio information below.

Rules:
- Answer naturally and conversationally.
- Keep answers short and suitable for a chatbot widget.
- Summarize information instead of dumping raw data.
- If information is not available in the portfolio, politely say so.
- Never invent information.
- You may answer questions about skills, projects, education, experience, contact details, achievements, and technologies.

Portfolio Data:
${JSON.stringify(pData, null, 2)}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: systemInstructionText,
              },
            ],
          },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't find an answer in the portfolio.";

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chat Error:", error);

    return res.status(500).json({
      success: false,
      reply: "Sorry, I encountered an error while processing your request.",
    });
  }
});


const startServer = async () => {
  await initDb();

  const tryListen = (port) => {
    const server = app.listen(port, () => {
      console.log(`Portfolio Express Server running on port ${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy. Trying ${nextPort}...`);
        server.close(() => tryListen(nextPort));
      } else {
        console.error("Server startup failed:", error);
        process.exit(1);
      }
    });
  };

  tryListen(PORT);
};

startServer();

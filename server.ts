import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDb } from "./src/db/index.js";
import { eq } from "drizzle-orm";
import { users } from "./src/db/schema.js";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple API Route example
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example API to get user (Placeholder for auth)
  app.get("/api/me", async (req, res) => {
    try {
      const db = getDb();
      const allUsers = await db.select().from(users).limit(1);
      res.json(allUsers[0] || null);
    } catch (e: any) {
      if (e.message.includes('DATABASE_URL is not set')) {
        res.status(503).json({ error: "Database not configured. Please add DATABASE_URL to your environment variables." });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  // AI Chat Route
  app.post("/api/chat", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }
      
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === "coach" ? "model" : "user",
        parts: [{ text: msg.text }]
      }));
      
      const lastMessage = messages[messages.length - 1]?.text || "";

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: "You are an AI life coach specialized in calisthenics, neuroscience, habit building, and productivity. Be supportive, concise, and offer actionable advice based on science (like Huberman Lab protocols). Keep responses brief (1-3 sentences).",
          temperature: 0.7,
        },
        history: formattedHistory
      });

      const response = await chat.sendMessage({ message: lastMessage });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error("AI Chat Error:", e);
      res.status(500).json({ error: e.message || "Failed to communicate with AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

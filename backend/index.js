import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { GoogleGenerativeAI } from "@google/generative-ai";

import connectDB from "./config/db.js";
import Group from "./models/Group.js";
import authRoutes from "./routes/auth.js";
import stockRoutes from "./routes/stocks.js";
import portfolioRoutes from "./routes/portfolio.js";
import expenseRoutes from "./routes/expenses.js";
import communityRoutes from "./routes/community.js";
import contactRoute from "./routes/contact.js";
import aiRoutes from "./routes/ai.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

connectDB();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", contactRoute);

// Socket.io — real-time chat with MongoDB message persistence
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join_group", (groupId) => {
    socket.join(groupId);
  });

  socket.on("send_message", async (data) => {
    // data: { groupId, user, text, time }
    try {
      await Group.findByIdAndUpdate(data.groupId, {
        $push: { messages: { user: data.user, text: data.text, time: data.time } }
      });
    } catch (e) { console.error("Msg persist error:", e.message); }
    io.to(data.groupId).emit("receive_message", data);
  });

  // ── WebRTC signaling ─────────────────────────────────────────────────────
  const webrtcRooms = {};  // roomId -> [socketId, ...]

  socket.on("webrtc:join", ({ roomId, userName }) => {
    if (!webrtcRooms[roomId]) webrtcRooms[roomId] = [];
    const room = webrtcRooms[roomId];

    if (room.length >= 2) {
      socket.emit("webrtc:full");
      return;
    }
    room.push(socket.id);
    socket.join(`webrtc:${roomId}`);
    socket.data.webrtcRoom = roomId;
    socket.data.userName = userName;

    if (room.length === 1) {
      socket.emit("webrtc:waiting");
    } else {
      // Notify the first peer that a second person has joined
      const firstSocketId = room[0];
      io.to(firstSocketId).emit("webrtc:peer-joined", { userName });
    }
  });

  socket.on("webrtc:offer", ({ roomId, offer, userName }) => {
    socket.to(`webrtc:${roomId}`).emit("webrtc:offer", { offer, userName });
  });
  socket.on("webrtc:answer", ({ roomId, answer }) => {
    socket.to(`webrtc:${roomId}`).emit("webrtc:answer", { answer });
  });
  socket.on("webrtc:ice", ({ roomId, candidate }) => {
    socket.to(`webrtc:${roomId}`).emit("webrtc:ice", { candidate });
  });
  socket.on("webrtc:leave", ({ roomId }) => {
    if (webrtcRooms[roomId]) {
      webrtcRooms[roomId] = webrtcRooms[roomId].filter(id => id !== socket.id);
      if (webrtcRooms[roomId].length === 0) delete webrtcRooms[roomId];
    }
    socket.to(`webrtc:${roomId}`).emit("webrtc:peer-left");
    socket.leave(`webrtc:${roomId}`);
  });
  // ─────────────────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Gemini Finance Chatbot
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const prompt = `You are FinanceHub AI, a knowledgeable financial assistant.

You can help with: investing, mutual funds, SIPs, ETFs, personal finance, budgeting, tax planning, banking, loans, economic news, and cryptocurrency (informational only).

Do NOT answer questions about specific real-time or historical stock prices — instead, direct users to check the Dashboard market section for live price data.

If asked something completely unrelated to finance, reply: "I focus on finance topics. Please ask me about investments, budgeting, or markets."

User question: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Gemini error:", error);
    if (error.status === 429) return res.json({ reply: "I'm temporarily unavailable due to usage limits. Please try again in a few seconds." });
    res.status(500).json({ error: "Gemini API error" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ FinanceHub backend running on http://localhost:${PORT}`);
});

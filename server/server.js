
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const messageRoutes = require("./routes/message");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User Online
  socket.on("userOnline", (userId) => {
    if (!userId) return;

    const id = String(userId);

    onlineUsers.set(id, socket.id);
    socket.userId = id;

    // Join personal room
    socket.join(id);

    console.log("User is online:", id);
    console.log("Personal room joined:", id);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // Join Chat Room
  socket.on("joinChat", ({ userId, receiverId }) => {
    if (!userId || !receiverId) return;

    const roomId = [String(userId), String(receiverId)]
      .sort()
      .join("_");

    socket.join(roomId);

    console.log("Chat room joined:", roomId);
  });

  // Send Real-Time Message
  socket.on("sendMessage", (data) => {
    const { sender, receiver, message } = data;

    if (!sender || !receiver || !message) return;

    const roomId = [String(sender), String(receiver)]
      .sort()
      .join("_");

    console.log("Message received:", data);

    io.to(roomId).emit("newMessage", {
      sender: String(sender),
      receiver: String(receiver),
      message,
      createdAt: new Date()
    });
  });

  // Typing Indicator
  socket.on("typing", ({ receiverId }) => {
    if (!socket.userId || !receiverId) return;

    const targetId = String(receiverId);

    console.log(
      `${socket.userId} is typing to ${targetId}`
    );

    socket.to(targetId).emit("userTyping", {
      userId: socket.userId
    });
  });

  // Stop Typing
  socket.on("stopTyping", ({ receiverId }) => {
    if (!socket.userId || !receiverId) return;

    const targetId = String(receiverId);

    console.log(
      `${socket.userId} stopped typing to ${targetId}`
    );

    socket.to(targetId).emit("userStoppedTyping", {
      userId: socket.userId
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log("User went offline:", userId);
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    console.log("User disconnected:", socket.id);
  });
});

// Home Route
app.get("/", (req, res) => {
  res.send("Real-Time Chat Application Backend is Running!");
});

// MongoDB Connection
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB Connection Failed:",
      error.message
    );
  });

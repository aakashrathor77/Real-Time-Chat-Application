
const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Send Message
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { receiver, message } = req.body;

    if (!receiver || !message || !message.trim()) {
      return res.status(400).json({
        message: "Receiver and message are required"
      });
    }

    if (receiver === req.userId) {
      return res.status(400).json({
        message: "You cannot message yourself"
      });
    }

    const receiverUser = await User.findById(receiver);

    if (!receiverUser) {
      return res.status(404).json({
        message: "Receiver not found"
      });
    }

    const newMessage = await Message.create({
      sender: req.userId,
      receiver,
      message: message.trim()
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send message",
      error: error.message
    });
  }
});

// Get Conversation
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const otherUser = await User.findById(req.params.userId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId }
      ]
    }).sort({ createdAt: 1 });

    res.json({
      message: "Conversation fetched successfully",
      messages
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch conversation",
      error: error.message
    });
  }
});

module.exports = router;

const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in user's profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "Profile fetched successfully",
      user
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile"
    });
  }
});

// Get all users except logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId }
    }).select("-password");

    res.json({
      message: "Users fetched successfully",
      users
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users"
    });
  }
});

module.exports = router;
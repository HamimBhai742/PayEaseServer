const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Import User Model
const crypto = require("crypto");
const JWT_SECRET = crypto.randomBytes(64).toString("hex");
console.log("Your JWT Secret:", JWT_SECRET);

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, role, pin, image } = req.body;
    // console.log(req.body);
    // Check if email or phone already exists
    let existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: "Email or phone already exists" });
    }
    // Create New User
    let newUser = new User({
      name,
      email,
      phone,
      role,
      pin,
      image,
      status: "Pending",
      newBonus: "InComplete",
    });
    newUser.pin = await bcrypt.hash(pin, 10);
    console.log(newUser);
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { phone, pin } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify PIN
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    // Generate JWT
    // const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    //   expiresIn: "10s",
    // });
    jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) {
          console.log("error 404040", err);
        }
        res.status(200).json({
          message: "Login successful",
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start Server
module.exports = router;

import express from "express";
import bcrypt from 'bcrypt';
import User from "../models/user.js"; // Make sure your User model is correctly imported
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");


// Store reset codes temporarily
const resetCodes = new Map();

// Route to send reset code to email
router.post("/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Received request to reset password for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "User not found" });
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    resetCodes.set(email, resetCode);

    console.log("Generated reset code:", resetCode);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${resetCode}`,
    });

    console.log("Reset paasword sent successfully!");
    res.json({ message: "Reset code sent to email" });

  } catch (error) {
    console.error("Error in /send-reset-code:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


router.post("/verify-reset-code", (req, res) => {
  const { email, code } = req.body;
  const storedCode = resetCodes.get(email);

  if (!storedCode) return res.status(400).json({ message: "Invalid or expired code" });
  if (storedCode !== code) return res.status(400).json({ message: "Incorrect code" });

  resetCodes.delete(email);
  res.json({ message: "Code verified" });
});


router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;

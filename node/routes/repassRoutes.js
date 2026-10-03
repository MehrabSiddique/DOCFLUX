import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user.js'; // Import your User model
import jwt from 'jsonwebtoken'; // If you're using JWT for authentication

const router = express.Router();

// Change Password Endpoint
router.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old and new passwords are required" });
  }

  try {
    // Extract JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    // Decode JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.userId;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect old password" });
    }

    // ✅ Manually hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Save updated user
    await user.save({ validateBeforeSave: false }); // skip validation if not needed

    return res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ error: "Server error, please try again later" });
  }
});




export default router;
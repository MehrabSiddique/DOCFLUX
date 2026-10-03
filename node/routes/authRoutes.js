import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/user.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Validation Middleware
const validateSignup = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register Route
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    console.log("Signup request received:", req.body);

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    // ✅ Return user info without password
    const userToReturn = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
    };
    return res.status(201).json({ message: "Signup successful", user: userToReturn });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Generate JWT with userId
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Send token and user data
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id, // ✅ use _id to match what frontend expects
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});



router.get('/user', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ fullName: user.fullName, email: user.email, profileImage: user.profileImage });
  } catch (err) {
    console.error("JWT Verify Error:", err);
    res.status(401).json({ message: 'Unauthorized' });
  }
});


router.put("/update", async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;

    // ✅ Extract token
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // ✅ Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded._id || decoded.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Update allowed fields
    if (name) user.fullName = name;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;

    // ⚠️ Handle password carefully
    if (password !== undefined && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        name: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});


router.get('/profile-image', authMiddleware, async (req, res) => {
  try {
    // Extract token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Decode the token and find the user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If the user has a profile image, send it as the response
    if (user.profileImage) {
      return res.json({ profileImage: user.profileImage });
    } else {
      return res.status(404).json({ message: 'Profile image not found' });
    }
  } catch (err) {
    console.error("Error fetching profile image:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

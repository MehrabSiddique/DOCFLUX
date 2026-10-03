import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, match: [/.+@.+\..+/, 'Please enter a valid email address'] },
  isVerified: { type: Boolean, default: false }, // Indicates whether the user's email is verified
  password: { type: String, required: true },
  profileImage: { type: String, default: null }, // URL or path to profile image
  resetToken: { type: String, default: null }, // Token for password reset
  resetTokenExpiry: { type: Date, default: null }, // Expiry time for the token
}, {
  collection: "auth", // 👈 This ensures the collection name is "auth"
  timestamps: true
});



export default mongoose.model('User', UserSchema);
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/authRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';
import repassRoutes from './routes/repassRoutes.js';
import documentRoutes from "./routes/documentRoutes.js";
import getdocRoutes from "./routes/getdocRoutes.js";  

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Apply body parser limits before routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.use('/auth', authRoutes);

app.use("/password", passwordRoutes);
app.use("/repassword", repassRoutes);
app.use("/documents", documentRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/get", getdocRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

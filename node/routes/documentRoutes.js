import express from "express";
import multer from "multer";
import path from "path";
import axios from "axios";
import mime from "mime-types";
import mongoose from 'mongoose';
import FormData from 'form-data';
import fs from "fs";
import Document from "../models/document.js";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUR_CLIENT_ID,
  process.env.YOUR_CLIENT_SECRET,
  process.env.YOUR_REDIRECT_URI
);

oauth2Client.setCredentials({
  access_token: process.env.YOUR_ACCESS_TOKEN,
  refresh_token: process.env.YOUR_REFRESH_TOKEN,
  scope: 'https://www.googleapis.com/auth/drive.file',
  token_type: 'Bearer',
  expiry_date: Date.now() + 3600000
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

router.post("/gdrive", upload.single("file"), async (req, res) => {
  const { userId } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = req.file.path;

  try {
    const fileMetadata = {
      name: req.file.originalname,
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(filePath),
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    fs.unlinkSync(filePath);

    const savedDoc = await Document.create({
      userId,
      name: req.file.originalname,
      filename: req.file.filename,         // ✅ required by schema
      mimetype: req.file.mimetype,         // ✅ required by schema
      filepath: req.file.path,   
      source: "gdrive",
      driveId: driveResponse.data.id,
      driveUrl: driveResponse.data.webViewLink,
    });

    res.status(200).json({
      message: "Uploaded to Google Drive",
      driveFile: driveResponse.data,
      document: savedDoc,
    });
  } catch (error) {
    console.error("Google Drive upload error:", error);
    res.status(500).json({
      message: "Failed to upload to Google Drive",
      error: error.message,
    });
  }
});

// Upload File
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { userId } = req.body;

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const mimetype = file.mimetype || mime.lookup(file.originalname);
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({ message: "Unsupported file type" });
    }
    const newDocument = new Document({
      userId:userId,
      filename: file.filename,
      filepath: file.path.replace(/\\/g, '/'), // normalize slashes for frontend
      mimetype: file.mimetype,
    });
    await newDocument.save();

    res.json({ message: "File uploaded successfully", document: newDocument });

  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error });
  }
});


// Extract Text (OCR)
router.post("/extract-text/:documentId", async (req, res) => {
  const { documentId } = req.params;
  console.log("📥 Request to extract text for:", documentId);

  try {
    const document = await Document.findById(documentId);
    if (!document) {
      console.log("⚠️ Document not found.");
      return res.status(404).json({ message: "Document not found" });
    }

    console.log("📄 Document filepath:", document.filepath);

    const isPDF = document.filepath.toLowerCase().endsWith(".pdf");
    const ocrServiceUrl = isPDF
      ? "http://localhost:8080/ocr/pdf/from-path"
      : "http://localhost:8080/ocr/image/from-path";

       // ✅ Correct absolute path resolution placed here
    const absolutePath = resolve(__dirname, "..", document.filepath);
    console.log("📂 Absolute Path sent to FastAPI:", absolutePath);

    console.log("🔗 Calling OCR service:", ocrServiceUrl);

    const response = await axios.post(ocrServiceUrl, {
      filepath: absolutePath, // ✅ send the correct absolute path
    });

    const extractedText = response.data.text;
    console.log("✅ OCR result:", extractedText?.slice(0, 100), "...");

    document.extractedText = extractedText;
    await document.save();

    res.json({ message: "Text extracted successfully", text: extractedText });
  } catch (error) {
    console.error("❌ Full Error:", error.stack);
    res.status(500).json({ message: "Failed to extract text" });
  }
});


router.post('/convert-doc/:documentId', upload.single('file'), async (req, res) => {
  const { documentId } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const isPDF = file.mimetype.toLowerCase().includes('pdf');
    const convertUrl = isPDF
      ? 'http://localhost:8080/convert-pdf-to-docx'
      : 'http://localhost:8080/convert-image-to-docx';

    // ✅ Debug logs before sending to Python backend
    console.log('📤 Sending file to:', convertUrl);
    console.log('📄 File path:', file.path);
    console.log('📁 File mimetype:', file.mimetype);
    console.log('🆔 Document ID:', documentId);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), file.originalname);

    const response = await axios.post(convertUrl, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
    });

    // Save DOCX file to disk
    const outputDocxPath = path.join('uploads', `converted-${Date.now()}.docx`);
    fs.writeFileSync(outputDocxPath, response.data);

    // Update the document entry in DB
    document.convertedDocxPath = outputDocxPath;
    await document.save();

    // Send DOCX back to client
    res.set({
      'Content-Disposition': 'attachment; filename="converted.docx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    res.send(response.data);
  } catch (error) {
    // ✅ Improved error handling with detailed output
    console.error('❌ Conversion error:', error.response?.status || error.code, error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to convert document' });
  } finally {
    // Clean up the uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
});



// Summarize Text
router.post("/summarize/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;

    // 1. Find the document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const extractedText = document.extractedText;
    if (!extractedText || extractedText.trim() === "") {
      return res.status(400).json({ message: "No extracted text found in the document" });
    }

    // 2. Send extracted text to FastAPI for summarization
    const fastApiURL = "http://localhost:8000/summarize/"; // Use 192.168.x.x only if needed
    const response = await axios.post(fastApiURL, { text: extractedText });

    // 3. Update the document with the summary
    document.summary = response.data.summary;
    await document.save();

    // 4. Return the updated document
    res.json({ message: "Text summarized successfully", document });
  } catch (error) {
    console.error("Error summarizing text:", error?.response?.data || error.message);
    res.status(500).json({
      message: "Error summarizing text",
      error: error?.response?.data || error.message,
    });
  }
});


// Extract Keywords
router.post("/extract-keywords/:documentId", async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) return res.status(404).json({ message: "Document not found" });

    const response = await axios.post("http://localhost:8000/keywords/", {
      text: document.summary,
    });

    document.keywords = response.data.keywords;
    await document.save();
    res.json({ message: "Keywords extracted", document });
  } catch (error) {
    res.status(500).json({ message: "Error extracting keywords", error });
  }
});

// Save Data Endpoint
router.post("/save", async (req, res) => {
  console.log("Incoming save request:", req.body);

  const { userId, type, content } = req.body;
  try {
    const document = await Document.findOne({ userId, _id: req.body.documentId });
    if (!document) return res.status(404).json({ message: "Document not found" });

    document[type] = content;
    await document.save();
    res.json({ message: `${type} saved successfully!`, document });
  } catch (error) {
    res.status(500).json({ message: "Error saving to database", error });
  }
});

router.get('/uploads/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Create the file path
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Determine content type based on file extension
    const extension = path.extname(filename).toLowerCase();
    let contentType;
    
    switch (extension) {
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      default:
        contentType = 'application/octet-stream'; // Default binary file
    }
    
    // Set headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error during file download' });
  }
});





export default router;

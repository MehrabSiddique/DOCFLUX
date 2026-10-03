import express from 'express';
import path from 'path';
import Document from "../models/document.js";
import fs from "fs";
import mongoose from 'mongoose';
import axios from 'axios';
import multer from "multer";
import { google } from 'googleapis';
import FormData from 'form-data'; // ✅ Node FormData
import { fileURLToPath } from 'url';

import{
  getAuthUrl,
  setTokensFromCode,
  uploadDocToDrive,
  downloadDocAsDocx,
} from '../utilis/google.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `updated-${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });


// Mark a document as favorite or unfavorite
router.post('/favorite/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.isFavorite = !document.isFavorite;
    await document.save();

    res.json({ message: 'Favorite status toggled', document });
  } catch (error) {
    console.error('❌ Error toggling favorite:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/remove-favorite/:docId', async (req, res) => {
  const { docId } = req.params;
  const { isFavorite } = req.body;

  if (!mongoose.Types.ObjectId.isValid(docId)) {
    return res.status(400).json({ message: 'Invalid document ID' });
  }

  try {
    const updatedDoc = await Document.findByIdAndUpdate(
      docId,
      { isFavorite },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json({ message: 'Favorite status updated', document: updatedDoc });
  } catch (err) {
    console.error('Error updating favorite:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/delete-doc/:docId', async (req, res) => {
  const { docId } = req.params;

  try {
    const doc = await Document.findById(docId);
    if (!doc) {
      console.error(`❌ Document not found for ID: ${docId}`);
      return res.status(404).json({ error: 'Document not found' });
    }

    const normalizedPath = path.join(__dirname, '..', doc.convertedDocxPath.replace(/\\/g, '/'));
    console.log('🧾 Deleting file at normalized path:', normalizedPath);

    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
      console.log('✅ File deleted');
    } else {
      console.warn('⚠️ File not found on disk:', normalizedPath);
    }

    await Document.findByIdAndDelete(docId);
    console.log('✅ Document deleted from DB');

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('❌ Error during deletion:', err.message);
    res.status(500).json({ error: 'Server error while deleting document' });
  }
});

router.get('/converted-docs/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Make a request to FastAPI
    const fastApiUrl = `http://localhost:8080/converted-docs/${userId}`;
    const response = await axios.get(fastApiUrl);

    const docs = response.data; // Should be an array of converted DOCX records
    res.json(docs);

  } catch (err) {
    console.error('Error fetching converted docs from FastAPI:', err.message);
    res.status(500).json({ message: 'Failed to retrieve converted documents' });
  }
});



// In your routes file
router.get('/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Document.find({ userId, isFavorite: true });
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorite documents' });
  }
});

router.get('/search-docs/:userId', async (req, res) => {
  const { userId } = req.params;
  const { query } = req.query;

  try {
    const docs = await Document.find({
      userId,
      $or: [
        { extractedText: { $regex: query, $options: 'i' } },
        { keywords: { $regex: query, $options: 'i' } },
        { summary: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(docs);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search-favorites/:userId', async (req, res) => {
  const { userId } = req.params;
  const { query } = req.query;

  if (!userId || !query) {
    return res.status(400).json({ error: 'User ID and query are required' });
  }

  try {
    const regex = new RegExp(query, 'i'); // case-insensitive search
    const results = await Document.find({
      userId,
      $or: [
        { extractedText: { $regex: regex } },
        { summary: { $regex: regex } },
        { keywords: { $regex: regex } },
      ],
    });
    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/download/:docId', async (req, res) => {
  try {
    const document = await Document.findById(req.params.docId);
    
    if (!document || !document.convertedDocxPath) {
      return res.status(404).json({ message: 'Document not found or not converted' });
    }
    
    // Verify the file exists
    const filePath = path.resolve(document.convertedDocxPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set the proper content type based on the file extension or mimetype
    const fileExtension = path.extname(filePath).toLowerCase();
    let contentType;
    
    if (fileExtension === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
      contentType = `image/${fileExtension.substring(1)}`;
    } else {
      // Default to octet-stream if we can't determine the type
      contentType = 'application/octet-stream';
    }
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    
    // Create a read stream and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).json({ message: 'Server error during download' });
  }
});


export default router;  // Use 'export default' for ES Module export

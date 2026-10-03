import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  mimetype: { type: String, required: true },
  extractedText: { type: String, required: false, default: '' }, // Initially empty
  summary: { type: String, required: false, default: '' },       // Optional until summarization
  keywords: { type: [String], required: false, default: [] },    // Filled after keyword extraction
  convertedDocxPath: { type: String, required: false, default: '' }, // New field
  isFavorite: { type: Boolean, default: false },
  googleDocLink: { type: String },
  googleDocId: { type: String },
}, {
  collection: 'documents',
  timestamps: true
});

export default mongoose.model('Document', DocumentSchema);

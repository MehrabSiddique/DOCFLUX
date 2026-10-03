import { google } from "googleapis";
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mime from 'mime-types';

dotenv.config(); // ✅ Load .env variables

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents'
];

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUR_CLIENT_ID,
  process.env.YOUR_CLIENT_SECRET,
  process.env.YOUR_REDIRECT_URI
);

// ✅ Automatically set credentials from .env
oauth2Client.setCredentials({
  access_token: process.env.YOUR_ACCESS_TOKEN,
  refresh_token: process.env.YOUR_REFRESH_TOKEN,
});

function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

async function setTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

const downloadDocAsDocx = async (fileId, outputPath) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const dest = fs.createWriteStream(outputPath);

    const res = await drive.files.export(
      {
        fileId,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      { responseType: 'stream' }
    );

    await new Promise((resolve, reject) => {
      res.data
        .on('end', () => {
          console.log('✅ File downloaded successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Error downloading file:', err);
          reject(err);
        })
        .pipe(dest);
    });

  } catch (error) {
    console.error('❌ Error in downloadDocAsDocx:', error);
    throw error;
  }
};

const uploadDocToDrive = async (filePath, fileName) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const detectedMimeType = mime.lookup(filePath); // Guess MIME from extension
    const isDocx = path.extname(filePath).toLowerCase() === '.docx';

    const fileMetadata = {
      name: fileName,
      mimeType: isDocx ? 'application/vnd.google-apps.document' : detectedMimeType,
    };

    const media = {
      mimeType: detectedMimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink, mimeType',
    });

    console.log(`✅ Uploaded file as ${response.data.mimeType}`);
    return response.data;

  } catch (err) {
    console.error('❌ Error uploading to Google Drive:', err.message);
    throw err;
  }
};

export {
  getAuthUrl,
  setTokensFromCode,
  uploadDocToDrive,
  downloadDocAsDocx,
  oauth2Client,
};

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  'YOUR_GOOGLE_CLIENT_ID',
  'YOUR_GOOGLE_CLIENT_SECRET',
  'http://localhost:3000' // Redirect URI you set in Step 1
);

// Generate the auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Required to get a refresh token
 scope:[
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
  ],
});

console.log('Visit this URL to authorize the app:\n', authUrl);

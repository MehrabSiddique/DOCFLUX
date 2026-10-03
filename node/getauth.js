import axios from 'axios';

async function getTokens() {
  const data = {
    code: '4/0AUJR-x4aUCXuE7c7cz2DTqJmRqGMaWj5m9AndQz7FeIczblKrxLFC-ZT2tHjTp0wcAuk3Q&scope=https://www.googleapis.com/auth/documents%20https://www.googleapis.com/auth/drive', // trimmed!
    client_id: 'YOUR_GOOGLE_CLIENT_ID',
    client_secret: 'YOUR_GOOGLE_CLIENT_SECRET',
    redirect_uri: 'http://localhost:3000',
    grant_type: 'authorization_code'
  };
  
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('✅ Tokens:', response.data);
  } catch (error) {
    console.error('❌ Error fetching tokens:', error.response.data);
  }
}

getTokens();
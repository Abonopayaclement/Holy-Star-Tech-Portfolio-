export const CONFIG = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  FIREBASE: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  }
};

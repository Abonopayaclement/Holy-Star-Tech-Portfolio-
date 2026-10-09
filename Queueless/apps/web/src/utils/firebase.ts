import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { CONFIG } from './config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  const { FIREBASE } = CONFIG;
  if (!FIREBASE.apiKey || !FIREBASE.projectId) {
    throw new Error('Firebase Configuration is missing. Please check your .env file and ensure REACT_APP_FIREBASE_API_KEY and REACT_APP_FIREBASE_PROJECT_ID are set.');
  }
  
  app = initializeApp(FIREBASE);
  auth = getAuth(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export { auth };
export default app;

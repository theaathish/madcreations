// Firebase configuration from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase config
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing Firebase config: ${key}`);
  }
});

// Initialize Firebase with QUIC disabled
import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

// Initialize Firestore with error handling
const db = getFirestore(app);

// Enable offline persistence with a function that can be called when needed
const enableOfflinePersistence = () => {
  if (typeof window !== 'undefined') { // Only run in browser
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Offline persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support offline persistence.');
        } else {
          console.warn('Error enabling offline persistence:', err);
        }
      });
  }
};

// Enable offline persistence when the app initializes
if (typeof window !== 'undefined') {
  enableOfflinePersistence();
}

// Initialize Storage
const storage = getStorage(app);

// Export initialized services and utilities
export { app, auth, db, storage, enableOfflinePersistence };

export default app;

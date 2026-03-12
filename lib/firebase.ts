import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'sofi-dream.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'sofi-dream',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'sofi-dream.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:000000:android:000000',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// In React Native, Firestore has offline SQLite persistence enabled by default.
// Do NOT call enableIndexedDbPersistence — that's Web-only and throws in RN.
export const db = getFirestore(app);
export const storage = getStorage(app);

// Flag so other modules can check if Firebase is properly configured
export const isFirebaseConfigured =
  (process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '').length > 10;

export default app;

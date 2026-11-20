import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const missingConfig = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`);

export const firebaseConfigError = missingConfig.length
  ? `Missing Firebase environment variables: ${missingConfig.join(', ')}`
  : '';

const app = firebaseConfigError ? null : getApps().length ? getApp() : initializeApp(config);

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

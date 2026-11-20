import { initializeApp } from 'firebase/app';
import { addDoc, collection, getDocs, getFirestore, serverTimestamp } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const firebaseReady = Boolean(cfg.projectId && cfg.apiKey);
const db = firebaseReady ? getFirestore(initializeApp(cfg)) : null;

export async function fetchLands<T>(): Promise<T[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'lands'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
}

export async function saveEnquiry(data: { property_id: string; booking_type: string; preferred_date: string | null; message: string; name?: string; phone?: string }) {
  if (!db) throw new Error('Firebase is not configured');
  await addDoc(collection(db, 'enquiries'), { ...data, status: 'pending', created_at: serverTimestamp() });
}

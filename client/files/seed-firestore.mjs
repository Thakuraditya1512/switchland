// Usage: node scripts/seed-firestore.mjs ./serviceAccountKey.json
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(readFileSync(process.argv[2] || './serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(key) });
const db = getFirestore();
const lands = JSON.parse(readFileSync(new URL('./lands.seed.json', import.meta.url), 'utf8'));
const batch = db.batch();
for (const { id, ...data } of lands) batch.set(db.collection('lands').doc(id), data);
await batch.commit();
console.log(`Seeded ${lands.length} lands`);

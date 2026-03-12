import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

// Lazy singleton — Firebase only loads when real-time features are used
let app: FirebaseApp | null = null;
let db: Database | null = null;

const firebaseConfig = {
  apiKey:        import.meta.env.VITE_FIREBASE_API_KEY        || '',
  authDomain:    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN     || '',
  projectId:     import.meta.env.VITE_FIREBASE_PROJECT_ID      || '',
  databaseURL:   import.meta.env.VITE_FIREBASE_DATABASE_URL    || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET  || '',
  appId:         import.meta.env.VITE_FIREBASE_APP_ID          || '',
};

export function getFirebaseDB(): Database {
  if (!db) {
    if (!firebaseConfig.databaseURL) {
      throw new Error(
        'Firebase nie jest skonfigurowany. Ustaw VITE_FIREBASE_DATABASE_URL w .env.local'
      );
    }
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_FIREBASE_DATABASE_URL);
}

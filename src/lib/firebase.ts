// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Configuración de Firebase (valores del proyecto edugest-9020b)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let db = null;
let auth = null;
let storage = null;

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
}

export function getFirebaseApp() {
  if (!app && isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirestoreDB() {
  if (!db) {
    const a = getFirebaseApp();
    if (a) {
      db = getFirestore(a);
      // Activar persistencia offline (IndexedDB) para que funcione sin internet
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistencia offline: múltiples pestañas abiertas');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistencia offline no soportada en este navegador');
        }
      });
    }
  }
  return db;
}

export function getFirebaseAuth() {
  if (!auth) {
    const a = getFirebaseApp();
    if (a) auth = getAuth(a);
  }
  return auth;
}

export function getFirebaseStorage() {
  if (!storage) {
    const a = getFirebaseApp();
    if (a) storage = getStorage(a);
  }
  return storage;
}

// Helper para detectar si Firebase está disponible
export function firebaseDisponible(): boolean {
  return isFirebaseConfigured() && !!getFirestoreDB();
}

// Subir foto base64 a Firebase Storage y retornar URL pública
export async function subirFotoFirebase(base64Data: string, folder: string, id: string): Promise<string> {
  const st = getFirebaseStorage();
  if (!st) throw new Error('Firebase Storage no disponible');
  const fileRef = ref(st, `${folder}/${id}.jpg`);
  await uploadString(fileRef, base64Data, 'data_url');
  return getDownloadURL(fileRef);
}

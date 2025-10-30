// src/firebase.ts

import { initializeApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics'

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA7igYoDM3WR9Yp1nXeNudf3URY0Aec5fA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'amewala.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'amewala',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'amewala.appspot.com', // ✅ fixed: should end with .appspot.com
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '437107509427',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:437107509427:web:6489d0e726a98d281cc8c6',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-5706LJ5HKT',
}

// ✅ Initialize Firebase
export const app = initializeApp(firebaseConfig)

// ✅ Initialize Firebase Auth with IndexedDB persistence to work in WebViews (Capacitor)
// If initializeAuth has already been called (hot reload), fall back to getAuth
let initializedAuth
try {
  initializedAuth = initializeAuth(app, { persistence: indexedDBLocalPersistence })
} catch (_) {
  // initializeAuth throws if called twice; get existing instance instead
  initializedAuth = getAuth(app)
}

// ✅ Export the auth instance
export const auth = initializedAuth
export const db = getFirestore(app)
export const storage = getStorage(app)

// ✅ Initialize Analytics (only if supported)
export const analyticsPromise = analyticsIsSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null)

// ✅ Default export (optional)
export default app

// src/firebase.ts

import { initializeApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics'
import { Capacitor } from '@capacitor/core'

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

// ✅ Initialize Firebase Auth
// Use getAuth by default - it handles persistence automatically
// Only use initializeAuth if getAuth fails (rare edge case)
let initializedAuth
try {
  // Try to get existing auth instance first
  initializedAuth = getAuth(app)
  console.log('[Firebase] Auth initialized with getAuth()')
} catch (error) {
  // Fallback: if getAuth fails (shouldn't happen), try initializeAuth
  console.warn('[Firebase] getAuth failed, trying initializeAuth:', error)
  try {
    if (Capacitor.isNativePlatform()) {
      initializedAuth = initializeAuth(app, { persistence: indexedDBLocalPersistence })
      console.log('[Firebase] Auth initialized with IndexedDB persistence for native platform')
    } else {
      initializedAuth = initializeAuth(app)
      console.log('[Firebase] Auth initialized with default persistence')
    }
  } catch (initError) {
    console.error('[Firebase] ❌ Failed to initialize auth:', initError)
    throw new Error('Firebase Auth initialization failed')
  }
}

// Validate auth instance
if (!initializedAuth) {
  throw new Error('Firebase Auth instance is null')
}

// Verify auth config
if (!initializedAuth.config || !initializedAuth.config.authDomain) {
  console.error('[Firebase] ❌ Auth config is invalid:', initializedAuth.config)
  throw new Error('Firebase Auth configuration is invalid')
}

console.log('[Firebase] ✅ Auth initialized successfully')
console.log('[Firebase] Auth domain:', initializedAuth.config.authDomain)

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

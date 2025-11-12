import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { getRedirectResult } from 'firebase/auth'
import { auth } from './firebaseConfig'
import { getEnvironmentType } from './utils/environment'

// Configure a readable status bar on mobile devices
if (Capacitor.isNativePlatform()) {
  // Set dark icons on a light background and a subtle background color
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setBackgroundColor({ color: '#f8f9fa' }).catch(() => {})
}

// Handle Firebase Auth redirect result on app startup
// This is critical for WebView/APK builds where OAuth redirects return to the app
console.log('[App] Initializing app in:', getEnvironmentType())
console.log('[App] Current URL:', window.location.href)
console.log('[App] Checking for Firebase Auth redirect result...')

getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      console.log('[App] ✅ Firebase Auth redirect completed successfully')
      console.log('[App] User:', result.user.uid, result.user.email)
      // The auth state change listener in useAuth will handle the rest
    } else {
      console.log('[App] No pending redirect result')
    }
  })
  .catch((error) => {
    // Only log errors that aren't "no redirect" cases
    if (error.code && error.code !== 'auth/operation-not-allowed') {
      console.error('[App] ❌ Error processing redirect result:', error.code, error.message)
    } else {
      console.log('[App] No redirect result to process (this is normal on first load)')
    }
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

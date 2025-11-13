import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapacitorApp } from '@capacitor/app'
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
console.log('[App] Current origin:', window.location.origin)

// Handle app state changes for Capacitor (when app returns from browser)
if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener('appStateChange', (state) => {
    console.log('[App] App state changed:', state.isActive ? 'active' : 'background')
    if (state.isActive) {
      // App came to foreground, check for redirect result
      console.log('[App] App became active, checking for redirect result...')
      if (auth) {
        getRedirectResult(auth)
          .then((result) => {
            if (result?.user) {
              console.log('[App] ✅ Redirect result received after app resume:', result.user.uid)
            }
          })
          .catch((err) => {
            // Ignore normal "no redirect" errors
            if (err.code !== 'auth/operation-not-allowed' && err.code !== 'auth/argument-error') {
              console.log('[App] No redirect result on resume')
            }
          })
      }
    }
  })

  // Handle app URL open (deep links)
  CapacitorApp.addListener('appUrlOpen', (data) => {
    console.log('[App] App opened with URL:', data.url)
    // The URL will be handled by the intent filter and loaded in the WebView
    // Firebase Auth will process it automatically
  })
}

// Only check redirect result if auth is available
if (auth) {
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
      // Ignore common "no redirect" errors - these are normal
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/argument-error') {
        console.log('[App] No redirect result to process (this is normal on first load)')
      } else if (error.code) {
        console.error('[App] ❌ Error processing redirect result:', error.code, error.message)
      } else {
        console.log('[App] No redirect result to process')
      }
    })
} else {
  console.error('[App] ❌ Auth instance not available during initialization')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { getRedirectResult } from 'firebase/auth'
import { auth } from './firebaseConfig'

// Configure a readable status bar on mobile devices
if (Capacitor.isNativePlatform()) {
  // Set dark icons on a light background and a subtle background color
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setBackgroundColor({ color: '#f8f9fa' }).catch(() => {})
}

getRedirectResult(auth).catch(() => {
  // No pending redirect result — ignore
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

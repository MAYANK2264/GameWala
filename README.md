# GameWala

GameWala is a React + TypeScript + Vite application for managing console inventory, repairs, and sales. The project now ships with mobile-first improvements so it can run as a Progressive Web App (PWA) and inside a Trusted Web Activity (TWA) wrapper.

## Prerequisites

- Node.js 18+
- npm 9+
- Firebase project configured with Firestore, Authentication, and Storage

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The dev server runs on http://localhost:5173.

## Production Build

```bash
npm run build
```

To preview a production build locally:

```bash
npm run preview
```

## Firebase Hosting Deploy

```bash
firebase deploy
```

## Firebase Authentication Setup for Web & Android APK

### Required Authorized Domains

For Google Sign-In to work in both web and Android APK builds, you **must** add the following domains in Firebase Console:

1. Go to **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
2. Add these domains (if not already present):
   - `localhost`
   - `amewala.web.app` (or your Firebase hosting domain)
   - `amewala.firebaseapp.com` (or your Firebase project domain)
   - `capacitor://localhost` (for Capacitor WebView)
   - `http://localhost` (for local development)

### OAuth Redirect URIs

If your Google OAuth client ID has origin restrictions:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID used by Firebase
3. Add these **Authorized redirect URIs**:
   - `https://amewala.firebaseapp.com/__/auth/handler`
   - `https://amewala.web.app/__/auth/handler`
   - `capacitor://localhost/__/auth/handler`
   - `http://localhost:5173/__/auth/handler` (for local dev)

### Android APK Configuration

The Android manifest (`android/app/src/main/AndroidManifest.xml`) includes intent filters to handle OAuth redirects:

- `https://amewala.firebaseapp.com`
- `https://amewala.web.app`
- `capacitor://localhost`
- `http://localhost`

These allow Firebase Auth redirects to return to the app after Google sign-in.

### Debugging Authentication

The app includes comprehensive debug logging. Check the browser/WebView console for:

- `[App]` - App initialization and redirect result handling
- `[Auth]` - Authentication flow, environment detection, and user state changes

Common issues:
- **"unauthorized-domain"**: Add the domain to Firebase Authorized domains
- **Redirect not working in APK**: Verify intent filters in AndroidManifest.xml
- **Popup blocked**: The app automatically falls back to redirect flow

## Barcode Scanning Support

- External USB/HID scanners automatically detect rapid keyboard input and trigger lookups.
- Desktop and mobile cameras use an on-screen unified scanner with device selection, rear/front toggle, and flashlight support where available.
- Manual barcode input remains available as a fallback.
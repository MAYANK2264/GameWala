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

### Step 1: Firebase Console - Authorized Domains

For Google Sign-In to work in both web and Android APK builds, you **must** add the following domains:

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project: **amewala**
3. Navigate to: **Authentication** → **Settings** → **Authorized domains** tab
4. Click **Add domain** and add these domains (one at a time, if not already present):
   - `localhost`
   - `amewala.web.app`
   - `amewala.firebaseapp.com`

**Note:** Do NOT add `capacitor://localhost` or `http://localhost` as domains - these are URL schemes, not domains. The Android app will use the Firebase domains above for OAuth redirects.

### Step 2: Google Cloud Console - OAuth Redirect URIs

If your Google OAuth client ID has origin restrictions, you need to add redirect URIs:

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Select your project: **amewala** (or the project linked to Firebase)
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (the one used by Firebase Authentication)
5. Click **Edit** (pencil icon)
6. In **Authorized redirect URIs** section, click **Add URI** and add these URLs (one at a time):
   - `https://amewala.firebaseapp.com/__/auth/handler`
   - `https://amewala.web.app/__/auth/handler`
   - `http://localhost:5173/__/auth/handler` (for local development)
   - `http://localhost:3000/__/auth/handler` (if you use port 3000 for local dev)
7. Click **Save**

**Important:** The redirect URIs must be complete URLs including the `/__/auth/handler` path. 

**Format:** `https://your-domain.com/__/auth/handler`

- The `/__/auth/handler` is Firebase's built-in endpoint for OAuth callbacks
- You don't create this route - Firebase handles it automatically
- You just need to add the complete URL to Google Cloud Console
- Example: `https://amewala.firebaseapp.com/__/auth/handler` (not just `https://amewala.firebaseapp.com`)

### Step 3: Enable Email/Password Authentication

To allow employees to sign up and sign in with email/password:

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project: **amewala**
3. Navigate to: **Authentication** → **Sign-in method** tab
4. Find **Email/Password** in the list
5. Click on **Email/Password**
6. Enable the toggle for **Email/Password** (first toggle)
7. Optionally enable **Email link (passwordless sign-in)** if you want passwordless authentication (not required)
8. Click **Save**

**Note:** After enabling Email/Password, employees can:
- Sign up with email, password, and their name
- Sign in with their email and password
- Their account data (email, name, role) will be stored in Firestore under the `users` collection
- New employees start with `role: 'pending'` until an owner approves them in Settings

### Step 4: Android APK Configuration

The Android manifest (`android/app/src/main/AndroidManifest.xml`) includes intent filters to handle OAuth redirects. These are already configured and allow Firebase Auth redirects to return to the app after Google sign-in:

- `https://amewala.firebaseapp.com` ✅
- `https://amewala.web.app` ✅
- `capacitor://localhost` ✅ (URL scheme for Capacitor, not a domain)
- `http://localhost` ✅ (for local testing)

**No action needed** - these are already set up in the code.

### Step 5: Debugging Authentication

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
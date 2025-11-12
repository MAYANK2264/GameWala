# Firebase Authentication Setup Guide

Complete step-by-step instructions for configuring Firebase Auth to work in both web and Android APK.

## Prerequisites

- Firebase project: **amewala**
- Firebase hosting domain: **amewala.web.app**
- Firebase project domain: **amewala.firebaseapp.com**

---

## Step 1: Firebase Console - Authorized Domains

### What to do:
Add authorized domains so Firebase allows Google Sign-In from these origins.

### Steps:
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select project: **amewala**
3. Go to: **Authentication** → **Settings** → **Authorized domains** tab
4. Click **Add domain** button
5. Add these domains **one at a time** (if not already present):

   ```
   localhost
   ```
   ```
   amewala.web.app
   ```
   ```
   amewala.firebaseapp.com
   ```

6. Click **Done** after each domain

### What NOT to add:
- ❌ `capacitor://localhost` - This is a URL scheme, not a domain
- ❌ `http://localhost` - Just use `localhost` (without http://)

### Expected result:
You should see these domains in the list:
- `localhost`
- `amewala.web.app`
- `amewala.firebaseapp.com`
- `*.firebaseapp.com` (default, already there)

---

## Step 2: Google Cloud Console - OAuth Redirect URIs

### What to do:
Configure OAuth redirect URIs so Google can redirect back to your app after sign-in.

### Steps:
1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **amewala** (or the project linked to your Firebase project)
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (look for one with name like "Web client (auto created by Google Service)" or similar)
5. Click the **Edit** icon (pencil) next to it
6. Scroll down to **Authorized redirect URIs** section
7. Click **Add URI** button
8. Add these URLs **one at a time**:

   ```
   https://amewala.firebaseapp.com/__/auth/handler
   ```
   ```
   https://amewala.web.app/__/auth/handler
   ```
   ```
   http://localhost:5173/__/auth/handler
   ```
   ```
   http://localhost:3000/__/auth/handler
   ```

9. Click **Save** button at the bottom

### Important notes:
- ✅ The path `/__/auth/handler` is required - Firebase uses this specific endpoint
- ✅ Use `https://` for production domains
- ✅ Use `http://` for localhost (development)
- ✅ Include the port number for localhost (5173 for Vite, 3000 if you use that)

### Expected result:
After saving, you should see all redirect URIs listed in the OAuth client configuration.

---

## Step 3: Verify Android Manifest (Already Done)

The Android manifest already includes the correct intent filters. No action needed, but here's what's configured:

**File:** `android/app/src/main/AndroidManifest.xml`

Intent filters handle these redirects:
- ✅ `https://amewala.firebaseapp.com`
- ✅ `https://amewala.web.app`
- ✅ `capacitor://localhost` (URL scheme for Capacitor)
- ✅ `http://localhost` (for local testing)

---

## Step 4: Testing

### Test Web Version:
1. Run `npm run dev`
2. Open http://localhost:5173
3. Click "Sign in with Google"
4. Should open popup or redirect to Google sign-in
5. After signing in, should return to app and be logged in

### Test Android APK:
1. Build APK: `npm run android-build` or use GitHub Actions
2. Install APK on Android device
3. Open the app
4. Click "Sign in with Google"
5. Should open browser/WebView for Google sign-in
6. After signing in, should return to app and be logged in

### Debug Logging:
Check the console (browser DevTools or Android logcat) for:
- `[App]` - App initialization messages
- `[Auth]` - Authentication flow messages

Look for:
- ✅ `[Auth] Environment detected: Native (Capacitor)` - Confirms WebView detection
- ✅ `[Auth] Will use redirect flow: true` - Confirms redirect will be used
- ✅ `[Auth] ✅ Redirect result received` - Confirms successful sign-in

---

## Troubleshooting

### Error: "unauthorized-domain"
**Solution:** Add the domain to Firebase Console → Authentication → Settings → Authorized domains

### Error: "redirect_uri_mismatch"
**Solution:** Add the exact redirect URI to Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs

### Sign-in works on web but not in APK
**Check:**
1. Android manifest has intent filters (already configured ✅)
2. Firebase authorized domains include `amewala.firebaseapp.com` and `amewala.web.app`
3. OAuth redirect URIs include `https://amewala.firebaseapp.com/__/auth/handler`

### Redirect doesn't return to app
**Check:**
1. Android manifest intent filters are correct (already configured ✅)
2. App is using `signInWithRedirect` in WebView (automatic ✅)
3. Check console logs for `[Auth]` messages to see what's happening

---

## Quick Reference

### Firebase Console URLs:
- **Authorized Domains:** https://console.firebase.google.com/project/amewala/authentication/settings
- **Authentication Settings:** https://console.firebase.google.com/project/amewala/authentication

### Google Cloud Console URLs:
- **Credentials:** https://console.cloud.google.com/apis/credentials?project=amewala
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent?project=amewala

### Required Domains (Firebase):
- `localhost`
- `amewala.web.app`
- `amewala.firebaseapp.com`

### Required Redirect URIs (Google Cloud):
- `https://amewala.firebaseapp.com/__/auth/handler`
- `https://amewala.web.app/__/auth/handler`
- `http://localhost:5173/__/auth/handler`
- `http://localhost:3000/__/auth/handler` (optional, if you use port 3000)


# Google Cloud Console Setup Guide for GameWala

Complete step-by-step instructions to configure Google Cloud Console OAuth credentials for Firebase Authentication.

## Prerequisites

- Firebase project: **amewala**
- Firebase project ID: **amewala**
- You have access to the Firebase Console

---

## Step 1: Find Your Google Cloud Project

### Option A: From Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **amewala**
3. Click the **⚙️ Settings** icon (gear icon) in the top left
4. Click **Project settings**
5. Scroll down to **Your apps** section
6. Look for the **Web app** (or click on it if you see it)
7. In the app details, you'll see:
   - **Project ID**: `amewala`
   - **App ID**: `1:437107509427:web:6489d0e726a98d281cc8c6`
8. The number `437107509427` is your **Google Cloud Project Number**

### Option B: From Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Look at the project dropdown at the top (next to "Google Cloud")
3. If you see **amewala** in the list, select it
4. If you don't see it, you may need to link it (see Step 2)

---

## Step 2: Link Firebase Project to Google Cloud (If Needed)

If you don't see your project in Google Cloud Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **amewala**
3. Click **⚙️ Settings** → **Project settings**
4. Scroll to **Project ID** section
5. You'll see: **Project ID**: `amewala`
6. Click the link that says **"View in Google Cloud Console"** or **"Manage in Google Cloud Console"**
7. This will open Google Cloud Console with the correct project selected

---

## Step 3: Navigate to OAuth Credentials

1. In [Google Cloud Console](https://console.cloud.google.com), make sure **amewala** is selected in the project dropdown
2. In the left sidebar, click **APIs & Services**
3. Click **Credentials** (under APIs & Services)
4. You should see a list of credentials

### Finding the Right OAuth Client

Look for an OAuth 2.0 Client ID with one of these names:
- **"Web client (auto created by Google Service)"**
- **"Firebase Auth Web Client"**
- **"Web client"**
- Or any OAuth client that shows **"Web application"** as the type

**How to identify it:**
- Type: **OAuth 2.0 Client ID**
- Application type: **Web application**
- It might have a name like "Web client" or be auto-created

**If you don't see any OAuth clients:**
- Firebase might not have created one yet
- Try signing in once in your app, and Firebase will create it automatically
- Or continue to Step 4 to create one manually

---

## Step 4: Edit OAuth Client (or Create New)

### If OAuth Client Exists:

1. Find the OAuth 2.0 Client ID (from Step 3)
2. Click the **Edit** icon (pencil icon) on the right side of that row
3. Skip to Step 5

### If No OAuth Client Exists:

1. Click **+ CREATE CREDENTIALS** button at the top
2. Select **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Click **CONFIGURE CONSENT SCREEN**
   - Select **Internal** (if you have Google Workspace) or **External**
   - Fill in:
     - **App name**: `GameWala`
     - **User support email**: Your email
     - **Developer contact email**: Your email
   - Click **SAVE AND CONTINUE**
   - Skip scopes (click **SAVE AND CONTINUE**)
   - Skip test users (click **SAVE AND CONTINUE**)
   - Click **BACK TO DASHBOARD**
4. Back at credentials page, click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Select **Web application** as Application type
6. Give it a name: `GameWala Web Client`
7. Skip to Step 5

---

## Step 5: Add Authorized Redirect URIs

In the OAuth client edit/create form:

1. Scroll down to **Authorized redirect URIs** section
2. Click **+ ADD URI** button
3. Add these URLs **one at a time** (copy and paste exactly):

   ```
   https://amewala.firebaseapp.com/__/auth/handler
   ```
   
   Click **+ ADD URI** again, then add:
   ```
   https://amewala.web.app/__/auth/handler
   ```
   
   Click **+ ADD URI** again, then add:
   ```
   http://localhost:5173/__/auth/handler
   ```
   
   Click **+ ADD URI** again, then add:
   ```
   http://localhost:3000/__/auth/handler
   ```

4. **Important:** Make sure each URL includes:
   - The protocol (`https://` or `http://`)
   - The full domain
   - The path `/__/auth/handler` (exactly as shown)

5. After adding all URIs, scroll down and click **SAVE**

---

## Step 6: Verify the Setup

After saving, you should see:

1. The OAuth client details page
2. Under **Authorized redirect URIs**, you should see all 4 URLs listed:
   - ✅ `https://amewala.firebaseapp.com/__/auth/handler`
   - ✅ `https://amewala.web.app/__/auth/handler`
   - ✅ `http://localhost:5173/__/auth/handler`
   - ✅ `http://localhost:3000/__/auth/handler`

3. **Client ID** and **Client secret** are shown (you don't need to copy these - Firebase uses them automatically)

---

## Step 7: Verify Firebase Console Settings

1. Go back to [Firebase Console](https://console.firebase.google.com)
2. Select project: **amewala**
3. Go to **Authentication** → **Settings** → **Authorized domains** tab
4. Make sure these domains are listed:
   - ✅ `localhost`
   - ✅ `amewala.web.app`
   - ✅ `amewala.firebaseapp.com`

If any are missing, click **Add domain** and add them.

---

## Step 8: Test the Setup

1. Open your app: `http://localhost:5173`
2. Try to sign in with Google
3. Check the browser console for any errors
4. If you see `auth/unauthorized-domain` or `redirect_uri_mismatch`, double-check:
   - Google Cloud Console redirect URIs (Step 5)
   - Firebase authorized domains (Step 7)

---

## Troubleshooting

### "I can't find the OAuth client in Google Cloud Console"

**Solution:**
1. Make sure you're in the correct Google Cloud project (amewala)
2. Check the project dropdown at the top of Google Cloud Console
3. Try going to Firebase Console → Project Settings → "View in Google Cloud Console" link
4. If still not found, create a new OAuth client (Step 4)

### "redirect_uri_mismatch error"

**Solution:**
1. Go to Google Cloud Console → Credentials → Edit OAuth Client
2. Check that the redirect URI matches **exactly** (including `/__/auth/handler`)
3. Make sure you added `http://localhost:5173/__/auth/handler` (not just `http://localhost:5173`)
4. Save and wait a few seconds for changes to propagate

### "unauthorized-domain error"

**Solution:**
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add the domain (without `http://` or `https://`)
3. For localhost, just add `localhost` (not `http://localhost`)

### "I'm in the wrong Google Cloud project"

**Solution:**
1. In Google Cloud Console, click the project dropdown at the top
2. Select the correct project: **amewala**
3. If you don't see it, go to Firebase Console → Project Settings → "View in Google Cloud Console"

---

## Quick Reference

### Google Cloud Console URLs:
- **Credentials**: https://console.cloud.google.com/apis/credentials?project=amewala
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent?project=amewala
- **Project Selector**: https://console.cloud.google.com/home/dashboard?project=amewala

### Firebase Console URLs:
- **Project Settings**: https://console.firebase.google.com/project/amewala/settings/general
- **Authorized Domains**: https://console.firebase.google.com/project/amewala/authentication/settings

### Required Redirect URIs:
```
https://amewala.firebaseapp.com/__/auth/handler
https://amewala.web.app/__/auth/handler
http://localhost:5173/__/auth/handler
http://localhost:3000/__/auth/handler
```

### Required Authorized Domains (Firebase):
```
localhost
amewala.web.app
amewala.firebaseapp.com
```

---

## Summary Checklist

- [ ] Found the correct Google Cloud project (amewala)
- [ ] Navigated to APIs & Services → Credentials
- [ ] Found or created OAuth 2.0 Client ID
- [ ] Added all 4 redirect URIs to OAuth client
- [ ] Saved the OAuth client configuration
- [ ] Verified Firebase authorized domains include all 3 domains
- [ ] Tested sign-in in the app

Once all checkboxes are complete, your Google Sign-In should work! 🎉


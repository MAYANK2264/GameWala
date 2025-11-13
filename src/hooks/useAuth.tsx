import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { shouldUseRedirectAuth, getEnvironmentType, isWebView } from '../utils/environment'
import type { AuthError } from 'firebase/auth'

export type UserRole = 'owner' | 'staff' | 'pending' | 'inactive'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [authBusy, setAuthBusy] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    // Validate auth instance
    if (!auth) {
      console.error('[Auth] ❌ Auth instance is not available')
      setLoading(false)
      return
    }

    // Debug: Log environment type
    const envType = getEnvironmentType()
    console.log('[Auth] Environment detected:', envType)
    console.log('[Auth] Is WebView:', isWebView())
    console.log('[Auth] Should use redirect:', shouldUseRedirectAuth())
    console.log('[Auth] Auth domain:', auth.config?.authDomain || 'not set')
    console.log('[Auth] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')

    // Set language code
    try {
      auth.languageCode = navigator.language
    } catch (e) {
      console.warn('[Auth] Failed to set language code:', e)
    }

    // For WebView/Capacitor, ensure IndexedDB persistence
    // For regular browsers, use default persistence (don't override)
    if (isWebView()) {
      // In WebView, we might need IndexedDB persistence
      // But only set it if not already set
      setPersistence(auth, browserLocalPersistence)
        .then(() => console.log('[Auth] Persistence set to local'))
        .catch((e) => {
          console.warn('[Auth] Could not set persistence (may already be set):', e.message)
        })
    }

    // Resolve pending redirect results (errors included) to avoid getting stuck
    console.log('[Auth] Checking for pending redirect result...')
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          console.log('[Auth] ✅ Redirect result received for user:', res.user.uid, res.user.email)
          setLoginError(null)
        } else {
          console.log('[Auth] No pending redirect result (this is normal)')
        }
      })
      .catch((err) => {
        // Ignore common "no redirect" errors
        if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/argument-error') {
          console.log('[Auth] No redirect result to process (normal on first load)')
        } else {
          console.error('[Auth] ❌ Redirect sign-in failed:', err.code, err.message)
          // Only show user-facing error for real issues
          if (err.code && !err.code.includes('operation-not-allowed') && !err.code.includes('argument-error')) {
            setLoginError('We could not complete Google sign-in. Please try again or use the email invite option below.')
          }
        }
      })

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      console.log('[Auth] 🔄 Auth state changed:', fbUser ? `User: ${fbUser.uid} (${fbUser.email})` : 'No user')
      setUser(fbUser)
      if (fbUser) {
        console.log('[Auth] ✅ User authenticated:', fbUser.uid, fbUser.email)
      }
      if (!fbUser) {
        console.log('[Auth] 👤 No user, setting role to null')
        setRole(null)
        setLoading(false)
        return
      }

      try {
        console.log('[Auth] 📄 Fetching user document from Firestore...')
        const userRef = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          console.log('[Auth] 📝 Creating new user document...')
          await setDoc(userRef, {
            uid: fbUser.uid,
            email: fbUser.email ?? null,
            displayName: fbUser.displayName ?? null,
            role: 'pending' as UserRole,
            createdAt: serverTimestamp(),
            active: true,
          })
          console.log('[Auth] ✅ User document created with role: pending')
          setRole('pending')
        } else {
          const data = snap.data() as { role?: UserRole; active?: boolean }
          const userRole = data.active === false ? 'inactive' : ((data.role as UserRole) ?? 'pending')
          console.log('[Auth] ✅ User document found, role:', userRole)
          setRole(userRole)
        }
      } catch (err) {
        console.error('[Auth] ❌ Failed to read/create user doc:', err)
        setRole('pending')
      } finally {
        setLoading(false)
        console.log('[Auth] ✅ Auth initialization complete')
      }
    })
    return () => unsub()
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (authBusy) {
      console.log('[Auth] Login already in progress, ignoring')
      return
    }

    // Validate auth instance
    if (!auth) {
      console.error('[Auth] ❌ Cannot sign in: Auth instance is not available')
      setLoginError('Authentication is not initialized. Please refresh the page.')
      return
    }

    setAuthBusy(true)
    setLoginError(null)
    
    const envType = getEnvironmentType()
    console.log('[Auth] 🔐 Starting Google sign-in in:', envType)
    
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    provider.addScope('email')
    provider.addScope('profile')

    // Use improved environment detection
    const shouldRedirect = shouldUseRedirectAuth()
    console.log('[Auth] Will use redirect flow:', shouldRedirect)

    const handleAuthError = (err: AuthError) => {
      console.error('Google sign-in failed:', err)
      switch (err.code) {
        case 'auth/unauthorized-domain':
          setLoginError('This domain is not authorized in Firebase Authentication. Add the current host in Firebase settings.')
          break
        case 'auth/network-request-failed':
          setLoginError('Network error during sign-in. Check your connection and try again.')
          break
        case 'auth/popup-blocked':
        case 'auth/popup-closed-by-user':
          setLoginError('The pop-up was blocked or closed. Please allow pop-ups and try again.')
          break
        case 'auth/operation-not-supported-in-this-environment':
        case 'auth/web-storage-unsupported':
        case 'auth/webview-unsupported':
          setLoginError('This environment blocks Google sign-in. Open the app in Chrome or the default browser and retry.')
          break
        default:
          setLoginError('Google sign-in failed. Please try again or contact the workspace owner.')
      }
    }

    const attemptRedirect = async () => {
      console.log('[Auth] 🔄 Attempting signInWithRedirect...')
      console.log('[Auth] Current origin:', window.location.origin)
      console.log('[Auth] Current href:', window.location.href)
      
      // For Capacitor/WebView, ensure we're using the app's origin
      // Firebase will redirect back to the current origin
      try {
        await signInWithRedirect(auth, provider)
        console.log('[Auth] ✅ Redirect initiated, page will navigate')
        // Page will navigate, so we don't reset authBusy here
      } catch (redirectErr) {
        console.error('[Auth] Redirect error:', redirectErr)
        throw redirectErr
      }
    }

    const attemptPopup = async () => {
      console.log('[Auth] 🔄 Attempting signInWithPopup...')
      const result = await signInWithPopup(auth, provider)
      console.log('[Auth] ✅ Popup sign-in successful:', result.user.uid)
      return result
    }

    try {
      if (shouldRedirect) {
        try {
          await attemptRedirect()
          // If redirect succeeds, the page will navigate, so we don't reset authBusy
          return
        } catch (err) {
          const error = err as AuthError
          console.error('[Auth] ❌ Redirect sign-in failed:', error.code, error.message)
          
          // In WebView, if redirect fails, we might need to show an error
          // since popup likely won't work either
          if (isWebView()) {
            handleAuthError(error)
            setAuthBusy(false)
            return
          }
          
          // Fallback to popup for non-WebView environments
          console.log('[Auth] 🔄 Falling back to popup...')
          try {
            await attemptPopup()
            setAuthBusy(false)
            return
          } catch (popupErr) {
            handleAuthError(popupErr as AuthError)
            setAuthBusy(false)
            return
          }
        }
      } else {
        // Try popup first for browser environments
        try {
          await attemptPopup()
          setAuthBusy(false)
          return
        } catch (err) {
          const error = err as AuthError
          console.warn('[Auth] ⚠️ Popup failed, trying redirect:', error.code)
          
          // Fallback to redirect if popup is blocked
          if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            try {
              await attemptRedirect()
              return // Page will navigate
            } catch (redirectErr) {
              handleAuthError(redirectErr as AuthError)
              setAuthBusy(false)
              return
            }
          } else {
            handleAuthError(error)
            setAuthBusy(false)
            return
          }
        }
      }
    } catch (err) {
      const error = err as AuthError
      console.error('[Auth] ❌ Unexpected error during sign-in:', error)
      handleAuthError(error)
      setAuthBusy(false)
    }
  }, [authBusy])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  return useMemo(
    () => ({
      user,
      role,
      loading,
      authBusy,
      loginError,
      setLoginError,
      inviteEmail,
      setInviteEmail,
      loginWithGoogle,
      logout,
    }),
    [user, role, loading, authBusy, loginError, inviteEmail, loginWithGoogle, logout]
  )
}

export default useAuth



import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
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

    // Validate auth instance before use
    if (!auth || !auth.config || !auth.config.authDomain) {
      console.error('[Auth] ❌ Invalid auth instance:', auth)
      setLoginError('Firebase Authentication is not properly configured. Please refresh the page.')
      setLoading(false)
      return
    }

    console.log('[Auth] ✅ Auth instance validated')
    console.log('[Auth] Auth domain:', auth.config.authDomain)
    console.log('[Auth] Auth API key:', auth.config.apiKey ? 'Set' : 'Missing')

    // Note: getRedirectResult is called in main.tsx on app startup
    // We don't call it here to avoid conflicts
    console.log('[Auth] Skipping getRedirectResult here (handled in main.tsx)')

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
      console.error('[Auth] ❌ Google sign-in failed:', err.code, err.message)
      console.error('[Auth] Full error:', err)
      
      // Provide specific error messages
      switch (err.code) {
        case 'auth/unauthorized-domain':
          setLoginError('This domain is not authorized. Please add it in Firebase Console → Authentication → Settings → Authorized domains.')
          break
        case 'auth/network-request-failed':
          setLoginError('Network error. Check your internet connection and try again.')
          break
        case 'auth/popup-blocked':
        case 'auth/popup-closed-by-user':
          setLoginError('Sign-in popup was blocked. Please allow pop-ups and try again.')
          break
        case 'auth/operation-not-supported-in-this-environment':
        case 'auth/web-storage-unsupported':
        case 'auth/webview-unsupported':
          setLoginError('This environment does not support Google sign-in. Please use a supported browser.')
          break
        case 'auth/argument-error':
          setLoginError('Authentication configuration error. Please check Firebase settings.')
          break
        case 'auth/redirect-cancelled-by-user':
          setLoginError('Sign-in was cancelled. Please try again.')
          break
        case 'auth/redirect-operation-pending':
          setLoginError('Sign-in is already in progress. Please wait...')
          break
        default:
          // Show the actual error code for debugging
          const errorMsg = err.code 
            ? `Sign-in failed: ${err.code}. ${err.message || 'Please try again.'}`
            : 'Google sign-in failed. Please try again or contact support.'
          setLoginError(errorMsg)
      }
    }

    const attemptRedirect = async () => {
      console.log('[Auth] 🔄 Attempting signInWithRedirect...')
      console.log('[Auth] Current origin:', window.location.origin)
      console.log('[Auth] Current href:', window.location.href)
      console.log('[Auth] Auth domain:', auth.config?.authDomain)
      
      // Validate auth before use
      if (!auth || !auth.config || !auth.config.authDomain) {
        throw new Error('Auth instance is not properly initialized')
      }
      
      // For Capacitor/WebView, ensure we're using the app's origin
      // Firebase will redirect back to the current origin
      try {
        console.log('[Auth] Starting redirect flow...')
        console.log('[Auth] Provider:', provider.providerId)
        
        // Call signInWithRedirect - this will navigate away
        await signInWithRedirect(auth, provider)
        console.log('[Auth] ✅ Redirect initiated successfully, page will navigate')
        // Page will navigate, so we don't reset authBusy here
      } catch (redirectErr) {
        const error = redirectErr as AuthError
        console.error('[Auth] ❌ Redirect error:', error.code, error.message)
        console.error('[Auth] Redirect error details:', redirectErr)
        
        // If redirect is already pending, that's actually okay - just wait
        if (error.code === 'auth/redirect-operation-pending') {
          console.log('[Auth] Redirect already in progress, waiting...')
          // Don't throw - let it continue
          return
        }
        
        // Re-throw to be handled by caller
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
          // Set a timeout to reset authBusy if redirect doesn't complete (user might cancel)
          setTimeout(() => {
            if (authBusy) {
              console.warn('[Auth] ⚠️ Redirect timeout - user may have cancelled')
              setAuthBusy(false)
            }
          }, 30000) // 30 seconds timeout
          return
        } catch (err) {
          const error = err as AuthError
          console.error('[Auth] ❌ Redirect sign-in failed:', error.code, error.message)
          
          // In WebView, if redirect fails, show error since popup won't work
          if (isWebView()) {
            handleAuthError(error)
            setAuthBusy(false)
            return
          }
          
          // Fallback to popup for non-WebView environments (mobile browser)
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
      loginWithGoogle,
      logout,
    }),
    [user, role, loading, authBusy, loginError, loginWithGoogle, logout]
  )
}

export default useAuth



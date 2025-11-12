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
  browserSessionPersistence,
  inMemoryPersistence,
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
    // Debug: Log environment type
    const envType = getEnvironmentType()
    console.log('[Auth] Environment detected:', envType)
    console.log('[Auth] Is WebView:', isWebView())
    console.log('[Auth] Should use redirect:', shouldUseRedirectAuth())
    console.log('[Auth] Auth domain:', auth.config.authDomain)
    console.log('[Auth] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')

    // Ensure local persistence and language before listeners
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('[Auth] Persistence set to local'))
      .catch(() => {
        console.warn('[Auth] Local persistence failed, trying session')
        return setPersistence(auth, browserSessionPersistence)
      })
      .catch(() => {
        console.warn('[Auth] Session persistence failed, using memory')
        return setPersistence(auth, inMemoryPersistence)
      })
      .catch((e) => console.warn('[Auth] setPersistence failed:', e))
    
    auth.languageCode = navigator.language

    // Resolve pending redirect results (errors included) to avoid getting stuck
    console.log('[Auth] Checking for pending redirect result...')
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          console.log('[Auth] ✅ Redirect result received for user:', res.user.uid, res.user.email)
          setLoginError(null)
        } else {
          console.log('[Auth] No pending redirect result')
        }
      })
      .catch((err) => {
        console.error('[Auth] ❌ Redirect sign-in failed:', err)
        // Only show error if it's not a "no redirect" case
        if (err.code !== 'auth/operation-not-allowed') {
          setLoginError('We could not complete Google sign-in. Please try again or use the email invite option below.')
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
      console.log('[Auth] Redirect URL will be:', window.location.origin)
      await signInWithRedirect(auth, provider)
      console.log('[Auth] ✅ Redirect initiated, page will navigate')
      // Page will navigate, so we don't reset authBusy here
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



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
import { Capacitor } from '@capacitor/core'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import isMobileDevice from '../utils/isMobile'
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
    // Ensure local persistence and language before listeners
    setPersistence(auth, browserLocalPersistence)
      .catch(() => setPersistence(auth, browserSessionPersistence))
      .catch(() => setPersistence(auth, inMemoryPersistence))
      .catch((e) => console.warn('setPersistence failed', e))
    auth.languageCode = navigator.language

    // Resolve pending redirect results (errors included) to avoid getting stuck
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          console.log('Redirect result received for user:', res.user.uid)
          setLoginError(null)
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in failed:', err)
        setLoginError('We could not complete Google sign-in. Please try again or use the email invite option below.')
      })

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (fbUser) console.log('Auth state changed user:', fbUser.uid)
      if (!fbUser) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: fbUser.uid,
            email: fbUser.email ?? null,
            displayName: fbUser.displayName ?? null,
            role: 'pending' as UserRole,
            createdAt: serverTimestamp(),
            active: true,
          })
          setRole('pending')
        } else {
          const data = snap.data() as { role?: UserRole; active?: boolean }
          if (data.active === false) {
            setRole('inactive')
          } else {
            setRole((data.role as UserRole) ?? 'pending')
          }
        }
      } catch (err) {
        console.error('Failed to read/create user doc:', err)
        setRole('pending')
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (authBusy) return
    setAuthBusy(true)
    setLoginError(null)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    const isStandaloneDisplay =
      typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia('(display-mode: standalone)').matches
    const navMaybeStandalone =
      typeof window !== 'undefined' ? (window.navigator as unknown as { standalone?: boolean }) : undefined
    const isIOSStandalone = navMaybeStandalone?.standalone === true
    const shouldRedirect = Capacitor.isNativePlatform() || isMobileDevice() || isStandaloneDisplay || isIOSStandalone

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

    let redirectTriggered = false

    const attemptRedirect = async () => {
      redirectTriggered = true
      await signInWithRedirect(auth, provider)
    }

    const attemptPopup = async () => {
      await signInWithPopup(auth, provider)
    }

    try {
      if (shouldRedirect) {
        try {
          await attemptRedirect()
          return
        } catch (err) {
          redirectTriggered = false
          console.warn('Redirect sign-in failed, falling back to popup', err)
          await attemptPopup()
          return
        }
      }
      await attemptPopup()
    } catch (err) {
      const error = err as AuthError
      if (!shouldRedirect) {
        try {
          await attemptRedirect()
          return
        } catch (redirectErr) {
          redirectTriggered = false
          handleAuthError(redirectErr as AuthError)
        }
      } else {
        handleAuthError(error)
      }
    } finally {
      if (!redirectTriggered) {
        setAuthBusy(false)
      }
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



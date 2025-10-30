import { useEffect, useMemo, useState, useCallback } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, getRedirectResult, setPersistence, browserLocalPersistence, type User as FirebaseUser } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

export type UserRole = 'owner' | 'staff' | 'pending' | 'inactive'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ensure local persistence and language before listeners
    setPersistence(auth, browserLocalPersistence).catch((e) => console.warn('setPersistence failed', e))
    auth.languageCode = navigator.language

    // Resolve pending redirect results (errors included) to avoid getting stuck
    getRedirectResult(auth)
      .then((res) => {
        if (res) console.log('Redirect result received for user:', res.user?.uid)
      })
      .catch((err) => {
        console.error('Redirect sign-in failed:', err)
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
    const provider = new GoogleAuthProvider()
    // Always show the Google account chooser
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, provider)
    } catch (e: any) {
      // Fallback to redirect if popup blocked or COOP prevents closing
      await signInWithRedirect(auth, provider)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  return useMemo(() => ({ user, role, loading, loginWithGoogle, logout }), [user, role, loading, loginWithGoogle, logout])
}

export default useAuth



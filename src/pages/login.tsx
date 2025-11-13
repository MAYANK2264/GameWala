import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export function Login() {
  const {
    user,
    loading,
    authBusy,
    loginWithGoogle,
    loginWithGoogleSwitchAccount,
    signUpWithEmail,
    signInWithEmail,
    loginError,
    setLoginError,
  } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        errors.displayName = 'Name is required'
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault()
    setFormErrors({})
    setLoginError(null)

    if (!validateForm()) {
      return
    }

    if (isSignUp) {
      const result = await signUpWithEmail(email, password, displayName)
      if (result?.success) {
        // Success - user will be redirected automatically
        setEmail('')
        setPassword('')
        setDisplayName('')
        setConfirmPassword('')
      }
    } else {
      const result = await signInWithEmail(email, password)
      if (result?.success) {
        // Success - user will be redirected automatically
        setEmail('')
        setPassword('')
      }
    }
  }

  return (
    <div className="container-px py-10 min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md card p-5 sm:p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">
            {isSignUp ? 'Create Account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-neutral-500">
            {isSignUp
              ? 'Sign up to start managing GameWala'
              : 'Sign in to manage GameWala'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-neutral-600">
            Preparing sign-in…
          </div>
        ) : (
          <>
            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label htmlFor="displayName" className="text-sm font-medium text-neutral-700">
                    Full Name *
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-base ${
                      formErrors.displayName
                        ? 'border-red-300 bg-red-50'
                        : 'border-neutral-300'
                    }`}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={authBusy}
                  />
                  {formErrors.displayName && (
                    <p className="text-xs text-red-600">{formErrors.displayName}</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-base ${
                    formErrors.email ? 'border-red-300 bg-red-50' : 'border-neutral-300'
                  }`}
                  placeholder="Enter your email"
                  autoComplete="email"
                  inputMode="email"
                  disabled={authBusy}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-base ${
                    formErrors.password ? 'border-red-300 bg-red-50' : 'border-neutral-300'
                  }`}
                  placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  disabled={authBusy}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-600">{formErrors.password}</p>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-base ${
                      formErrors.confirmPassword
                        ? 'border-red-300 bg-red-50'
                        : 'border-neutral-300'
                    }`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={authBusy}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-xs text-red-600">{formErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={authBusy}
                className={`touch-target w-full inline-flex items-center justify-center gap-2 font-medium text-base transition ${
                  authBusy
                    ? 'bg-neutral-400 text-white cursor-not-allowed'
                    : 'bg-neutral-900 text-white hover:opacity-90'
                }`}
                aria-busy={authBusy}
              >
                {authBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    {isSignUp ? 'Creating account…' : 'Signing in…'}
                  </span>
                ) : (
                  <>{isSignUp ? 'Sign Up' : 'Sign In'}</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-neutral-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Buttons */}
            <div className="space-y-2">
              <button
                onClick={loginWithGoogle}
                type="button"
                disabled={authBusy}
                className={`touch-target w-full inline-flex items-center justify-center gap-2 font-medium text-base transition ${
                  authBusy
                    ? 'bg-neutral-400 text-white cursor-not-allowed'
                    : 'bg-white border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                }`}
                aria-busy={authBusy}
              >
              {authBusy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600/70 border-t-transparent" />
                  Redirecting…
                </span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="#FFC107"
                      d="M43.6 20.5H42V20H24v8h11.3C33.7 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.8 5.1 29.7 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21c11 0 20-9 20-20 0-1.3-.1-2.2-.4-3.5z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.3 14.7l6.6 4.8C14.5 16.4 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.8 5.1 29.7 3 24 3 15.5 3 8.3 7.8 6.3 14.7z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 45c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.6-8.1l-6.5 5C8 40.2 15.4 45 24 45z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.6 20.5H42V20H24v8h11.3c-1.7 3.7-5.2 6-9.3 6-5.2 0-9.6-3.3-11.6-8.1l-6.5 5C8 40.2 15.4 45 24 45c11 0 20-9 20-20 0-1.3-.1-2.2-.4-3.5z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
            <button
              onClick={loginWithGoogleSwitchAccount}
              type="button"
              disabled={authBusy}
              className={`touch-target w-full inline-flex items-center justify-center gap-2 text-sm font-medium transition ${
                authBusy
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'text-neutral-600 hover:text-neutral-900 underline'
              }`}
              aria-busy={authBusy}
            >
              Use a different Google account
            </button>
            </div>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center text-sm text-neutral-600">
              {isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false)
                      setFormErrors({})
                      setLoginError(null)
                      setEmail('')
                      setPassword('')
                      setDisplayName('')
                      setConfirmPassword('')
                    }}
                    className="font-medium text-neutral-900 hover:underline"
                    disabled={authBusy}
                  >
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  New employee?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true)
                      setFormErrors({})
                      setLoginError(null)
                      setEmail('')
                      setPassword('')
                      setDisplayName('')
                      setConfirmPassword('')
                    }}
                    className="font-medium text-neutral-900 hover:underline"
                    disabled={authBusy}
                  >
                    Sign up
                  </button>
                </span>
              )}
            </div>
          </>
        )}

        {/* Error Messages */}
        <div className="space-y-3">
          {loginError && (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              role="alert"
              aria-live="assertive"
            >
              {loginError}
            </div>
          )}
          {!isSignUp && (
            <div className="text-xs text-neutral-500 text-center">
              Tip: On Android PWAs or Trusted Web Activity builds the app will automatically continue after you select your account.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login

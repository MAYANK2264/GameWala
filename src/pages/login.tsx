import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export function Login() {
  const {
    user,
    loading,
    authBusy,
    loginWithGoogle,
    loginError,
    setLoginError,
    inviteEmail,
    setInviteEmail,
  } = useAuth()
  const [inviteSubmitted, setInviteSubmitted] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const handleInviteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!inviteEmail.trim()) {
      setLoginError('Enter an email address to request an invite.')
      return
    }
    setInviteSubmitted(true)
    setLoginError(
      'We have noted your invite request. Please notify the workspace owner to approve this email in Firebase Authentication.'
    )
  }

  return (
    <div className="container-px py-10 min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md card p-5 sm:p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-neutral-500">
            Sign in with your Google Workspace account to manage GameWala.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-neutral-600">
            Preparing sign-in…
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            type="button"
            disabled={authBusy}
            className={`touch-target w-full inline-flex items-center justify-center gap-2 font-medium text-base transition ${
              authBusy ? 'bg-neutral-400 text-white' : 'bg-neutral-900 text-white hover:opacity-90'
            }`}
            aria-busy={authBusy}
          >
            {authBusy ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
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
        )}

        <div className="space-y-3">
          <div className="text-xs text-neutral-500 text-center">
            Tip: On Android PWAs or Trusted Web Activity builds the app will automatically continue after you select your account.
          </div>
          {loginError && (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              role="alert"
              aria-live="assertive"
            >
              {loginError}
            </div>
          )}
        </div>

        <form onSubmit={handleInviteSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="invite-email" className="text-sm font-medium text-neutral-700">
              Need access? Request an invite
            </label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(event) => {
                setInviteEmail(event.target.value)
                if (loginError) setLoginError(null)
              }}
              placeholder="your@company.com"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base"
              aria-describedby="invite-help"
              autoComplete="email"
            />
            <p id="invite-help" className="text-xs text-neutral-500">
              We will notify the workspace owner to approve this email in Firebase Authentication.
            </p>
          </div>
          <button
            type="submit"
            className="touch-target w-full rounded-md border border-neutral-300 bg-white font-medium text-neutral-700 hover:bg-neutral-100 transition"
          >
            {inviteSubmitted ? 'Invite requested' : 'Request invite'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

import useAuth from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export function Login() {
  const { user, loading, authBusy, loginWithGoogle } = useAuth()
  if (!loading && user) return <Navigate to="/dashboard" replace />
  return (
    <div className="container-px py-6">
      {/* Logo removed as per user request */}
      <div className="max-w-md mx-auto card p-4 sm:p-6 space-y-4 mt-4">
        <div className="text-xl font-semibold">Login</div>
        {loading ? (
          <div className="text-sm text-neutral-600">Preparing sign-in...</div>
        ) : (
          <button
            onClick={loginWithGoogle}
            type="button"
            disabled={authBusy}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 active:opacity-90 ${authBusy ? 'bg-neutral-400 text-white' : 'bg-neutral-900 text-white'}`}
          >
            {authBusy ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent"></span>
                Redirecting...
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.8 5.1 29.7 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21c11 0 20-9 20-20 0-1.3-.1-2.2-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.4 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.8 5.1 29.7 3 24 3 15.5 3 8.3 7.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.6-8.1l-6.5 5C8 40.2 15.4 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.7 3.7-5.2 6-9.3 6-5.2 0-9.6-3.3-11.6-8.1l-6.5 5C8 40.2 15.4 45 24 45c11 0 20-9 20-20 0-1.3-.1-2.2-.4-3.5z"/></svg>
                Sign in with Google
              </>
            )}
          </button>
        )}
        <div className="text-xs text-neutral-500">If nothing happens on click, tap again. On older Android WebViews popups can be slow to appear.</div>
      </div>
    </div>
  )
}

export default Login



import { useState, useEffect } from 'react'
import useAuth from '../hooks/useAuth'

const LOCK_PIN_KEY = 'app_lock_pin'
const LOCK_ENABLED_KEY = 'app_lock_enabled'

export function AppLockScreen() {
  const { user } = useAuth()
  const [isLocked, setIsLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [enteredPin, setEnteredPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setIsLocked(false)
      return
    }

    // Check if app lock is enabled
    const lockEnabled = localStorage.getItem(LOCK_ENABLED_KEY) === 'true'
    if (!lockEnabled) {
      setIsLocked(false)
      return
    }

    // Check if PIN is set
    const storedPin = localStorage.getItem(LOCK_PIN_KEY)
    if (!storedPin) {
      setIsLocked(false)
      return
    }

    setPin(storedPin)
    setIsLocked(true)
  }, [user])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (enteredPin === pin) {
      setIsLocked(false)
      setEnteredPin('')
      setError('')
    } else {
      setError('Incorrect PIN. Please try again.')
      setEnteredPin('')
    }
  }

  if (!isLocked) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-900 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg bg-white p-6 shadow-xl">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900">App Locked</h2>
          <p className="mt-2 text-sm text-neutral-600">Enter your PIN to continue</p>
        </div>
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              placeholder="Enter PIN"
              className="w-full rounded-md border border-neutral-300 px-4 py-3 text-center text-2xl tracking-widest"
              inputMode="numeric"
              maxLength={6}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-center text-sm text-red-600">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="touch-target w-full rounded-md bg-neutral-900 px-4 py-3 font-medium text-white transition hover:opacity-90"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}


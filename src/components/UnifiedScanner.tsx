import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

type ScannerStatus = 'idle' | 'scanning'

type UnifiedScannerProps = {
  onScan: (code: string) => void
  onStatusChange?: (status: ScannerStatus) => void
  onError?: (message: string | null) => void
}

const MIN_HID_LENGTH = 6
const HID_CHAR_WINDOW = 60 // ms between characters to consider as scanner input

export default function UnifiedScanner({ onScan, onStatusChange, onError }: UnifiedScannerProps) {
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [supportsTorch, setSupportsTorch] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [autoDetectHID, setAutoDetectHID] = useState(true)

  const html5Ref = useRef<Html5Qrcode | null>(null)
  const scannerActiveRef = useRef(false)
  const hidBufferRef = useRef('')
  const hidStartTimeRef = useRef<number | null>(null)
  const hidLastTimeRef = useRef<number | null>(null)
  const beepContextRef = useRef<AudioContext | null>(null)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)

  const containerId = useMemo(() => `unified-scanner-${Math.random().toString(36).slice(2, 10)}`, [])

  const notifyStatus = useCallback(
    (next: ScannerStatus) => {
      onStatusChange?.(next)
    },
    [onStatusChange]
  )

  const triggerFeedback = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      if (navigator.vibrate) navigator.vibrate(100)
    } catch (err) {
      console.debug('Vibration not supported', err)
    }

    try {
      const AudioContextImpl = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextImpl) return
      if (!beepContextRef.current) {
        beepContextRef.current = new AudioContextImpl()
      }
      const ctx = beepContextRef.current
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.value = 880
      gain.gain.value = 0.1
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.18)
    } catch (err) {
      console.debug('Unable to play scan tone', err)
    }
  }, [])

  const completeScannerRead = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return
      triggerFeedback()
      onScan(trimmed)
      hidBufferRef.current = ''
      hidStartTimeRef.current = null
      hidLastTimeRef.current = null
    },
    [onScan, triggerFeedback]
  )

  const processKey = useCallback(
    (key: string) => {
      if (!autoDetectHID) return
      const now = performance.now()
      if (key === 'Enter') {
        const elapsed = hidStartTimeRef.current ? now - hidStartTimeRef.current : Number.POSITIVE_INFINITY
        if (
          hidBufferRef.current.length >= MIN_HID_LENGTH &&
          elapsed <= Math.max(300, hidBufferRef.current.length * HID_CHAR_WINDOW)
        ) {
          completeScannerRead(hidBufferRef.current)
        } else {
          hidBufferRef.current = ''
        }
        hidStartTimeRef.current = null
        hidLastTimeRef.current = null
        return
      }

      if (key.length !== 1) {
        return
      }

      if (!hidStartTimeRef.current) {
        hidStartTimeRef.current = now
      }

      if (hidLastTimeRef.current && now - hidLastTimeRef.current > HID_CHAR_WINDOW) {
        hidBufferRef.current = ''
        hidStartTimeRef.current = now
      }

      hidBufferRef.current += key
      hidLastTimeRef.current = now

      if (hidBufferRef.current.length >= 48) {
        completeScannerRead(hidBufferRef.current)
      }
    },
    [autoDetectHID, completeScannerRead]
  )

  const stopCamera = useCallback(async () => {
    if (!html5Ref.current) {
      setIsScanning(false)
      notifyStatus('idle')
      return
    }
    try {
      if (scannerActiveRef.current) {
        await html5Ref.current.stop()
      }
    } catch (err) {
      console.warn('Failed to stop camera scanner', err)
    } finally {
      html5Ref.current.clear()
      html5Ref.current = null
      scannerActiveRef.current = false
      setIsScanning(false)
      setTorchOn(false)
      notifyStatus('idle')
    }
  }, [notifyStatus])

  const startCamera = useCallback(
    async (overrideId?: string) => {
      const targetDeviceId = overrideId ?? activeDeviceId
      if (!targetDeviceId) {
        setCameraError('Select a camera to begin scanning.')
        onError?.('Select a camera to begin scanning.')
        return
      }
      await stopCamera()

      const html5 = new Html5Qrcode(containerId, { verbose: false })
      html5Ref.current = html5
      setCameraError(null)
      setTorchOn(false)

      try {
        setIsScanning(true)
        scannerActiveRef.current = true
        notifyStatus('scanning')
        await html5.start(
          { deviceId: { exact: targetDeviceId } },
          {
            fps: 12,
            qrbox: { width: 280, height: 180 },
            aspectRatio: window.innerWidth < 640 ? 1.5 : 1.77,
          },
          (decodedText) => {
            const cleaned = decodedText.trim()
            if (!cleaned) return
            completeScannerRead(cleaned)
            void stopCamera()
          },
          () => {
            // per-frame decode errors are expected; no-op
          }
        )
      } catch (err: any) {
        console.error('Failed to start Html5Qrcode', err)
        setCameraError(err?.message ?? 'Unable to start camera')
        onError?.(err?.message ?? 'Unable to start camera')
        await stopCamera()
      }
    },
    [activeDeviceId, completeScannerRead, containerId, notifyStatus, onError, stopCamera]
  )

  const toggleTorch = useCallback(async () => {
    if (!supportsTorch || !html5Ref.current) return
    try {
      const newState = !torchOn
      // Try to get video track from the scanner
      const scannerElement = document.getElementById(containerId)
      if (!scannerElement) {
        throw new Error('Scanner element not found')
      }
      
      // Get video element from html5-qrcode
      const videoElement = scannerElement.querySelector('video') as HTMLVideoElement | null
      if (!videoElement || !videoElement.srcObject) {
        throw new Error('Video stream not available')
      }
      
      const stream = videoElement.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) {
        throw new Error('Video track not found')
      }
      
      // Apply torch constraint directly to the track
      await videoTrack.applyConstraints({
        advanced: [{ torch: newState } as unknown as MediaTrackConstraintSet],
      } as MediaTrackConstraints)
      
      setTorchOn(newState)
    } catch (err) {
      console.warn('Torch toggle failed', err)
      // Don't disable torch support on first failure, might be a timing issue
      if (err instanceof Error && err.message.includes('not found')) {
        setSupportsTorch(false)
        setTorchOn(false)
        setCameraError('Flashlight control is not supported on this camera.')
        onError?.('Flashlight control is not supported on this camera.')
      }
    }
  }, [supportsTorch, torchOn, onError, containerId])

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCameraError('Camera enumeration not supported in this browser.')
      onError?.('Camera enumeration not supported in this browser.')
      return
    }

    let cancelled = false
    const init = async () => {
      try {
        const requestStream = await navigator.mediaDevices.getUserMedia({ video: true })
        requestStream.getTracks().forEach((track) => track.stop())
      } catch (err) {
        console.debug('Camera permission not granted yet', err)
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (cancelled) return
        const videos = devices.filter((device) => device.kind === 'videoinput')
        setCameraDevices(videos)
        if (!videos.length) {
          setCameraError('No cameras detected.')
          onError?.('No cameras detected.')
        } else {
          // Prioritize back camera for scanning
        const backCamera = videos.find((d) => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        )
        // Prefer back camera, fallback to last device (usually back), then first
        const preferred = backCamera ?? (videos.length > 1 ? videos[videos.length - 1] : videos[0])
        setActiveDeviceId((current) => current ?? preferred?.deviceId ?? videos[0].deviceId)
          setCameraError(null)
          onError?.(null)
        }

        const supportedConstraints =
          typeof navigator.mediaDevices.getSupportedConstraints === 'function'
            ? navigator.mediaDevices.getSupportedConstraints()
            : undefined
        const torchSupported =
          !!supportedConstraints &&
          Object.prototype.hasOwnProperty.call(supportedConstraints, 'torch') &&
          (supportedConstraints as Record<string, unknown>).torch !== false
        setSupportsTorch(torchSupported)
      } catch (err: any) {
        if (cancelled) return
        const message = err?.message ?? 'Unable to access cameras.'
        setCameraError(message)
        setCameraDevices([])
        setActiveDeviceId(null)
        onError?.(message)
      }
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [onError])

  useEffect(() => {
    const hiddenEl = hiddenInputRef.current
    if (hiddenEl) {
      hiddenEl.focus({ preventScroll: true })
    }

    const interval = window.setInterval(() => {
      const el = hiddenInputRef.current
      if (!el) return
      const active = document.activeElement as HTMLElement | null
      if (!active || active === document.body) {
        el.focus({ preventScroll: true })
      }
    }, 2000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return
      }
      processKey(event.key)
    }
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [processKey])

  useEffect(() => {
    return () => {
      void stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="space-y-4">
      <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900 text-white" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
        <div id={containerId} className="h-full w-full" />
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/70 px-4 text-center text-sm text-neutral-100">
            {cameraError ?? 'Camera idle. Start scanning to open the camera.'}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 border border-white/10" aria-hidden="true" />

        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-2 bg-neutral-900/75 p-3 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => (isScanning ? void stopCamera() : void startCamera())}
            className="touch-target rounded-md bg-white/90 px-3 py-2 font-medium text-neutral-900 transition hover:bg-white"
          >
            {isScanning ? 'Stop Camera' : 'Start Camera Scan'}
          </button>
          {cameraDevices.length > 1 && (
            <label className="flex items-center gap-2 text-white/80">
              <span className="sr-only sm:not-sr-only">Camera</span>
              <select
                value={activeDeviceId ?? ''}
                onChange={(event) => {
                  const nextId = event.target.value
                  setActiveDeviceId(nextId)
                  if (isScanning) {
                    void startCamera(nextId)
                  }
                }}
                className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-white focus:border-neutral-100 focus:outline-none"
              >
                {cameraDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(-4)}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          {supportsTorch && (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              className="touch-target rounded-md border border-white/40 px-3 py-2 text-white transition hover:bg-white/10"
            >
              {torchOn ? 'Flashlight Off' : 'Flashlight On'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 sm:text-sm">
        <span>External USB/HID scanners will auto-detect when they type into the app.</span>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoDetectHID}
            onChange={(event) => setAutoDetectHID(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
          <span>Auto-detect barcode keyboard input</span>
        </label>
      </div>

      <input
        id="scanner-input"
        ref={hiddenInputRef}
        autoFocus
        onKeyDown={(event) => processKey(event.key)}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}


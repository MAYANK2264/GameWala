import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { getProductByBarcode, updateProductStatus } from '../services/inventory'
import { createRepair, updateRepair } from '../services/repairs'
import { storage } from '../firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { Product } from '../types/product'
import { useNavigate } from 'react-router-dom'

export default function ScanPage() {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [scanning, setScanning] = useState(false)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState(''); // NEW
  const [note, setNote] = useState('')
  const [recording, setRecording] = useState<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-reader'
  const navigate = useNavigate()

  useEffect(() => {
    async function init() {
      try {
        const devices = await Html5Qrcode.getCameras()
        setHasCamera(devices && devices.length > 0)
      } catch (e: any) {
        setHasCamera(false)
        setError('Camera access denied or unavailable')
      }
    }
    init()
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    }
  }, [])

  const startScan = async () => {
    setError(null)
    setProduct(null)
    setScanning(true)
    const html5QrCode = new Html5Qrcode(containerId, { verbose: false })
    scannerRef.current = html5QrCode
    try {
      const devices = await Html5Qrcode.getCameras()
      const camId = devices?.[0]?.id
      if (!camId) throw new Error('No camera found')
      await html5QrCode.start(
        camId,
        { fps: 10, qrbox: { width: 250, height: 120 }, aspectRatio: 1.77 },
        async (text) => {
          await onScan(text)
          try { await html5QrCode.stop() } catch {}
          setScanning(false)
        },
        () => {}
      )
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start camera')
      setScanning(false)
    }
  }

  const onScan = async (code: string) => {
    setBarcode(code)
    const p = await getProductByBarcode(code)
    setProduct(p)
    if (!p) setError('No product found for this barcode')
  }

  const onManualLookup = async () => {
    if (!barcode.trim()) return
    setProduct(null)
    setError(null)
    const p = await getProductByBarcode(barcode.trim())
    setProduct(p)
    if (!p) setError('No product found for this barcode')
  }

  const action = async (kind: 'sold' | 'repair' | 'edit') => {
    if (!product) return
    if (kind === 'edit') {
      navigate('/inventory')
      return
    }
    if (kind === 'repair') {
      setShowRepairModal(true)
      return
    }
    await updateProductStatus(product.id, kind === 'sold' ? 'sold' : 'in_repair')
    const refreshed = await getProductByBarcode(product.barcode)
    setProduct(refreshed)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      audioChunks.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
      }
      rec.start()
      setRecording(rec)
    } catch (e) {
      console.error('Mic permission denied', e)
    }
  }

  const stopRecording = () => {
    recording?.stop()
    setRecording(null)
  }

  const submitRepair = async () => {
    if (!product || !customerName.trim() || !/^\d{10}$/.test(customerPhone)) {
      setError('Customer name and valid 10-digit phone are required');
      return;
    }
    const repairId = await createRepair({
      productId: product.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(), // NEW
      receivedDate: new Date().toISOString().slice(0,10),
      expectedDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10),
      faultDescription: note || 'N/A',
      status: 'Received',
      estimate: Number(product.acquisitionPrice) || 0,
      assignedTo: '',
      notes: note || undefined,
    } as any)

    if (audioBlob) {
      const fileRef = ref(storage, `repairs/${repairId}.webm`)
      await uploadBytes(fileRef, audioBlob)
      const url = await getDownloadURL(fileRef)
      await updateRepair(repairId, { voiceNoteUrl: url })
    }

    await updateProductStatus(product.id, 'in_repair')
    const refreshed = await getProductByBarcode(product.barcode)
    setProduct(refreshed)
    setShowRepairModal(false)
    setCustomerName('')
    setCustomerPhone(''); // reset
    setNote('')
    setAudioBlob(null)
  }

  return (
    <div className="container-px py-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4 relative">
          <div className="font-semibold mb-2">Scan Barcode</div>
          <div className="relative">
            <div id={containerId} className="rounded-md overflow-hidden bg-black/80 aspect-video"></div>
            {scanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">Scanning…</div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {hasCamera ? (
              <button onClick={startScan} className="px-3 py-2 rounded-md bg-neutral-900 text-white">{scanning ? 'Restart' : 'Start Scan'}</button>
            ) : (
              <div className="text-sm text-neutral-600">Camera not available. Use manual input.</div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode manually"
              className="w-full rounded-md border-neutral-300"
            />
            <button onClick={onManualLookup} className="px-3 py-2 rounded-md bg-neutral-200">Lookup</button>
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="card p-4">
          <div className="font-semibold mb-2">Result</div>
          {!product ? (
            <div className="text-sm text-neutral-600">Scan a barcode to see product details.</div>
          ) : (
            <div className="space-y-2">
              <div><span className="text-neutral-600">Barcode:</span> <span className="font-mono">{product.barcode}</span></div>
              <div><span className="text-neutral-600">Brand:</span> {product.brand}</div>
              <div><span className="text-neutral-600">Type:</span> {product.type}</div>
              <div><span className="text-neutral-600">Condition:</span> {product.condition}</div>
              <div><span className="text-neutral-600">Price:</span> ₹{product.acquisitionPrice}</div>
              <div><span className="text-neutral-600">Status:</span> {(product as any).status ?? 'available'}</div>
              <div className="pt-2 flex flex-wrap gap-2">
                <button onClick={() => action('sold')} className="px-3 py-2 rounded-md bg-green-600 text-white">Mark Sold</button>
                <button onClick={() => action('repair')} className="px-3 py-2 rounded-md bg-amber-600 text-white">For Repairing</button>
                <button onClick={() => action('edit')} className="px-3 py-2 rounded-md bg-neutral-200">Edit</button>
              </div>
            </div>
          )}
        </div>
      </div>
        {showRepairModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-lg">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="font-semibold">Start Repair</div>
                <button onClick={() => setShowRepairModal(false)} className="px-2 py-1 rounded bg-neutral-200">Close</button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-neutral-600">Customer Name *</label>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-md border-neutral-300" placeholder="Enter customer name" />
                </div>
                <div>
                  <label className="text-xs text-neutral-600">Customer Phone Number *</label>
                  <input type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full rounded-md border-neutral-300"
                    placeholder="10 digit phone"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600">Notes (fault description)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border-neutral-300" rows={4} />
                </div>
                <div>
                  <div className="text-xs text-neutral-600 mb-1">Voice Note (optional)</div>
                  <div className="flex items-center gap-2">
                    {!recording && <button onClick={startRecording} className="px-3 py-2 rounded-md bg-neutral-900 text-white">Record</button>}
                    {recording && <button onClick={stopRecording} className="px-3 py-2 rounded-md bg-red-600 text-white">Stop</button>}
                    {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
                <button onClick={() => setShowRepairModal(false)} className="px-3 py-2 rounded-md bg-neutral-200">Cancel</button>
                <button onClick={submitRepair} className="px-3 py-2 rounded-md bg-neutral-900 text-white">Create Repair</button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}



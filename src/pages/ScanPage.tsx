import { useState, useRef } from 'react'
import { getProductByBarcode, updateProductStatus } from '../services/inventory'
import { createRepair, updateRepair } from '../services/repairs'
import { storage } from '../firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { Product } from '../types/product'
import { useNavigate } from 'react-router-dom'
import ScannerModal from '../components/ScannerModal'

// Component for collapsible notes
function ProductNotes({ notes }: { notes: string }) {
  const [expanded, setExpanded] = useState(false)
  if (!notes?.trim()) return null
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="touch-target w-full text-left text-xs font-medium text-neutral-600 hover:text-neutral-900"
      >
        {expanded ? '▼ Hide Notes' : '▶ Show Notes'}
      </button>
      {expanded && (
        <div className="mt-1 rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700">
          {notes}
        </div>
      )}
    </div>
  )
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [repairCondition, setRepairCondition] = useState('good')
  const [repairDeliveryDate, setRepairDeliveryDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const [note, setNote] = useState('')
  const [recording, setRecording] = useState<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const navigate = useNavigate()


  const handleScannedCode = async (code: string) => {
    setBarcode(code)
    setScannerMessage(`Scanned: ${code}`)
    setError(null)
    setShowScannerModal(false) // Close scanner modal
    const fetched = await getProductByBarcode(code)
    setProduct(fetched)
    if (!fetched) {
      setError('No product found for this barcode.')
    }
  }

  const onManualLookup = async () => {
    if (!barcode.trim()) {
      setError('Enter a barcode to lookup.')
      return
    }
    setError(null)
    const fetched = await getProductByBarcode(barcode.trim())
    setProduct(fetched)
    if (!fetched) setError('No product found for this barcode.')
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
      const recorder = new MediaRecorder(stream)
      audioChunks.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
      }
      recorder.start()
      setRecording(recorder)
    } catch (err) {
      console.error('Mic permission denied', err)
      setError('Microphone permission denied. Voice note will be skipped.')
    }
  }

  const stopRecording = () => {
    recording?.stop()
    setRecording(null)
  }

  const submitRepair = async () => {
    if (!product || !customerName.trim() || !/^\d{10}$/.test(customerPhone)) {
      setError('Customer name and a valid 10-digit phone number are required.')
      return
    }

    const repairId = await createRepair({
      productId: product.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      receivedDate: new Date().toISOString().slice(0, 10),
      expectedDate: repairDeliveryDate,
      deliveryDate: repairDeliveryDate,
      condition: repairCondition,
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
    setCustomerPhone('')
    setRepairCondition('good')
    const date = new Date()
    date.setDate(date.getDate() + 7)
    setRepairDeliveryDate(date.toISOString().slice(0, 10))
    setNote('')
    setAudioBlob(null)
  }

  return (
    <div className="container-px py-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4 lg:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Scan Barcode</h2>
            <p className="text-sm text-neutral-500">
              Use your device camera, an external scanner, or the manual field below.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="touch-target w-full inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-3 font-medium text-white transition hover:opacity-90"
          >
            Open Camera Scanner
          </button>

          <div className="space-y-2">
            <label htmlFor="manual-barcode" className="text-sm font-medium text-neutral-700">
              Manual entry
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="manual-barcode"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="Enter barcode manually"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base"
                autoComplete="off"
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={onManualLookup}
                className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition hover:opacity-90"
              >
                Lookup
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Tip: When using a USB scanner, just point to this page — the code will auto-fill when it beeps.
            </p>
          </div>

          {(scannerMessage || error) && (
            <div className="space-y-2">
              {scannerMessage && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {scannerMessage}
                </div>
              )}
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-4 lg:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Product Details</h2>
            <p className="text-sm text-neutral-500">Scan or search to view inventory details and quick actions.</p>
          </div>

          {!product ? (
            <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
              No product loaded yet. Scan a barcode or lookup manually to continue.
            </div>
          ) : (
            <div className="space-y-3">
              {product.photoUrls && product.photoUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.photoUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${product.brand} ${idx + 1}`}
                      className="h-32 w-32 flex-shrink-0 rounded-md border border-neutral-200 object-cover"
                    />
                  ))}
                </div>
              )}
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-neutral-500">Barcode</span>
                  <div className="font-mono text-base break-all">{product.barcode}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Brand</span>
                  <div className="break-words">{product.brand || '—'}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Type</span>
                  <div className="break-words">{product.type || '—'}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Condition</span>
                  <div className="break-words">{product.condition || '—'}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Selling Price</span>
                  <div>₹{product.acquisitionPrice ?? '—'}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Acquired Date</span>
                  <div>{product.acquiredDate || '—'}</div>
                </div>
                {product.acquiredFrom && (
                  <div>
                    <span className="text-neutral-500">Acquired From</span>
                    <div className="break-words">{product.acquiredFrom}</div>
                  </div>
                )}
                {(product as any).customerPhone && (
                  <div>
                    <span className="text-neutral-500">Customer Phone</span>
                    <div>{(product as any).customerPhone}</div>
                  </div>
                )}
                <div>
                  <span className="text-neutral-500">Status</span>
                  <div>{(product as any).status ?? 'available'}</div>
                </div>
              </div>
              {product.notes && (
                <ProductNotes notes={product.notes} />
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => action('sold')}
                  className="touch-target inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
                >
                  Mark Sold
                </button>
                <button
                  type="button"
                  onClick={() => action('repair')}
                  className="touch-target inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-700"
                >
                  For Repairing
                </button>
                <button
                  type="button"
                  onClick={() => action('edit')}
                  className="touch-target inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showRepairModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="modal-content w-full max-w-lg rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <h3 className="text-lg font-semibold">Start Repair</h3>
              <button
                type="button"
                onClick={() => setShowRepairModal(false)}
                className="touch-target rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700" htmlFor="repair-customer-name">
                  Customer Name *
                </label>
                <input
                  id="repair-customer-name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700" htmlFor="repair-customer-phone">
                  Customer Phone Number *
                </label>
                <input
                  id="repair-customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  placeholder="10 digit phone"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700" htmlFor="repair-condition">
                  Product Condition *
                </label>
                <select
                  id="repair-condition"
                  value={repairCondition}
                  onChange={(e) => setRepairCondition(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                >
                  <option value="good">Good</option>
                  <option value="bad">Bad</option>
                  <option value="very bad">Very Bad</option>
                  <option value="not repairable">Not Repairable</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700" htmlFor="repair-delivery-date">
                  Delivery Date *
                </label>
                <input
                  id="repair-delivery-date"
                  type="date"
                  value={repairDeliveryDate}
                  onChange={(e) => setRepairDeliveryDate(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700" htmlFor="repair-notes">
                  Notes (fault description)
                </label>
                <textarea
                  id="repair-notes"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-[120px] w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-neutral-700">Voice Note (optional)</div>
                <div className="flex flex-wrap items-center gap-2">
                  {!recording && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition hover:opacity-90"
                    >
                      Record
                    </button>
                  )}
                  {recording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
                    >
                      Stop
                    </button>
                  )}
                  {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} className="max-w-full" />}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 p-4">
              <button
                type="button"
                onClick={() => setShowRepairModal(false)}
                className="touch-target rounded-md border border-neutral-200 bg-white px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRepair}
                className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition hover:opacity-90"
              >
                Create Repair
              </button>
            </div>
          </div>
        </div>
      )}

      <ScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScan={handleScannedCode}
      />
    </div>
  )
}

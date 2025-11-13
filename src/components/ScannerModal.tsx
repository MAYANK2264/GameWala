import { useCallback } from 'react'
import UnifiedScanner from './UnifiedScanner'

type ScannerModalProps = {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
}

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const handleScan = useCallback(
    (code: string) => {
      onScan(code)
      // Close modal after a brief delay to show success
      setTimeout(() => {
        onClose()
      }, 300)
    },
    [onScan, onClose]
  )

  if (!isOpen) return null

  return (
    <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-2 sm:p-4">
      <div className="modal-content w-full max-w-4xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-target rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
          >
            Close
          </button>
        </div>
        <div className="p-2 sm:p-4">
          <UnifiedScanner
            onScan={handleScan}
            onError={(error) => {
              if (error) console.error('Scanner error:', error)
            }}
          />
        </div>
      </div>
    </div>
  )
}


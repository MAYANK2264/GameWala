import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

type Props = {
  code: string
  brand?: string
  productType?: string
}

export function BarcodeLabel({ code, brand, productType }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, code, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 14,
        height: 60,
        margin: 0,
      })
    }
  }, [code])

  return (
    <div className="inline-flex flex-col items-center p-2 border border-neutral-300 rounded-md bg-white">
      {(brand || productType) ? (
        <div className="text-xs mb-1 text-neutral-700">
          {brand}{brand && productType ? ' • ' : ''}{productType}
        </div>
      ) : null}
      <svg ref={svgRef}></svg>
      <div className="mt-2">
        <button
          onClick={() => {
            if (!svgRef.current) return
            const printWindow = window.open('', 'PRINT', 'height=600,width=420')
            if (!printWindow) return
            const svgMarkup = svgRef.current.outerHTML
            const title = [brand, productType].filter(Boolean).join(' • ')
            printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8" />
              <title>Barcode ${code}</title>
              <style>
                * { box-sizing: border-box; }
                body { margin: 16px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif; }
                .label { width: 320px; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
                .meta { font-size: 12px; color: #404040; margin-bottom: 6px; }
                .barcode { display: block; width: 100%; }
                @page { margin: 8mm; }
                @media print { body { margin: 0; } }
              </style>
            </head><body>
              <div class="label">
                ${title ? `<div class="meta">${title}</div>` : ''}
                <div class="barcode">${svgMarkup}</div>
              </div>
            </body></html>`)
            printWindow.document.close()
            printWindow.focus()
            printWindow.print()
            printWindow.close()
          }}
          className="px-2 py-1 text-xs rounded bg-neutral-900 text-white"
        >
          Print
        </button>
      </div>
    </div>
  )
}

export default BarcodeLabel



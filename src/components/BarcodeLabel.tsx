import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

type Props = {
  code: string
  brand?: string
  productType?: string
  sellingPrice?: number
}

export function BarcodeLabel({ code, brand, productType, sellingPrice }: Props) {
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

  const handlePrint = () => {
    if (!svgRef.current) return
    const printWindow = window.open('', 'PRINT', 'height=600,width=420')
    if (!printWindow) return
    const svgMarkup = svgRef.current.outerHTML
    const title = [brand, productType].filter(Boolean).join(' • ')
    const priceText = sellingPrice ? `₹${sellingPrice}` : ''
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>Barcode ${code}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 16px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif; }
        .label { width: 320px; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
        .meta { font-size: 12px; color: #404040; margin-bottom: 6px; }
        .price { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
        .barcode { display: block; width: 100%; }
        @page { margin: 8mm; size: auto; }
        @media print { 
          body { margin: 0; }
          .label { border: none; }
        }
      </style>
    </head><body>
      <div class="label">
        ${title ? `<div class="meta">${title}</div>` : ''}
        ${priceText ? `<div class="price">${priceText}</div>` : ''}
        <div class="barcode">${svgMarkup}</div>
      </div>
    </body></html>`)
    printWindow.document.close()
    printWindow.focus()
    // Use setTimeout to ensure content is loaded before print
    setTimeout(() => {
      printWindow.print()
      // Listen for afterprint event to close window
      printWindow.addEventListener('afterprint', () => {
        printWindow.close()
      }, { once: true })
      // Fallback: close after a delay if afterprint doesn't fire
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close()
        }
      }, 1000)
    }, 250)
  }

  const handleDownloadImage = () => {
    if (!svgRef.current) return
    const svg = svgRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width + 40
      canvas.height = img.height + 80
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      // Draw title
      if (brand || productType) {
        ctx!.font = '12px Arial'
        ctx!.fillStyle = '#404040'
        const title = [brand, productType].filter(Boolean).join(' • ')
        ctx!.fillText(title, 20, 20)
      }
      
      // Draw price
      if (sellingPrice) {
        ctx!.font = 'bold 14px Arial'
        ctx!.fillStyle = '#1a1a1a'
        ctx!.fillText(`₹${sellingPrice}`, 20, 40)
      }
      
      // Draw barcode
      if (ctx) {
        ctx.drawImage(img, 20, 50)
      }
      
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `barcode-${code}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleDownloadPDF = () => {
    if (!svgRef.current) return
    // For PDF, we'll use the print functionality with a PDF printer
    // This is a fallback - actual PDF generation would require a library like jsPDF
    const svg = svgRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const htmlContent = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Barcode ${code}</title>
          <style>
            body { margin: 20px; font-family: Arial, sans-serif; }
            .label { width: 320px; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
            .meta { font-size: 12px; color: #404040; margin-bottom: 6px; }
            .price { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
            .barcode { display: block; width: 100%; }
          </style>
        </head>
        <body>
          <div class="label">
            ${brand || productType ? `<div class="meta">${[brand, productType].filter(Boolean).join(' • ')}</div>` : ''}
            ${sellingPrice ? `<div class="price">₹${sellingPrice}</div>` : ''}
            <div class="barcode">${svgData}</div>
          </div>
        </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode-${code}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="inline-flex flex-col items-center p-2 border border-neutral-300 rounded-md bg-white">
      {(brand || productType) ? (
        <div className="text-xs mb-1 text-neutral-700">
          {brand}{brand && productType ? ' • ' : ''}{productType}
        </div>
      ) : null}
      {sellingPrice ? (
        <div className="text-sm font-semibold mb-1 text-neutral-900">
          ₹{sellingPrice}
        </div>
      ) : null}
      <svg ref={svgRef}></svg>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={handlePrint}
          className="px-2 py-1 text-xs rounded bg-neutral-900 text-white hover:bg-neutral-800"
        >
          Print
        </button>
        <button
          onClick={handleDownloadImage}
          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Download Image
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
        >
          Download HTML
        </button>
      </div>
    </div>
  )
}

export default BarcodeLabel



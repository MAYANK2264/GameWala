import { useEffect, useMemo, useState } from 'react'
import type { Product } from '../types/product'
import { fetchSoldProducts } from '../services/inventory'

type Range = 'day' | 'week' | 'month' | 'year' | 'all' | 'customYear'

function startOfWeek(d: Date) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Monday=0
  date.setDate(date.getDate() - day)
  date.setHours(0,0,0,0)
  return date
}

function startOfMonth(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), 1)
  return date
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1)
}

export function Sales() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('day')
  const [year, setYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchSoldProducts()
      setProducts(data)
      setLoading(false)
    }
    load()
  }, [])

  const years = useMemo(() => {
    const ys = new Set<number>()
    for (const p of products) {
      const ts: any = (p as any).updatedAt
      if (ts?.seconds) {
        ys.add(new Date(ts.seconds * 1000).getFullYear())
      }
    }
    return Array.from(ys).sort((a,b) => b-a)
  }, [products])

  const filtered = useMemo(() => {
    // Sort by updatedAt desc on client to avoid Firestore composite index
    const sorted = [...products].sort((a, b) => {
      const as: any = (a as any).updatedAt
      const bs: any = (b as any).updatedAt
      const at = as?.seconds ? as.seconds : 0
      const bt = bs?.seconds ? bs.seconds : 0
      return bt - at
    })
    if (range === 'all') return sorted
    const now = new Date()
    let start: Date
    if (range === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (range === 'week') {
      start = startOfWeek(now)
    } else if (range === 'month') {
      start = startOfMonth(now)
    } else if (range === 'year') {
      start = startOfYear(now)
    } else {
      start = new Date(year, 0, 1)
    }
    return sorted.filter(p => {
      const ts: any = (p as any).updatedAt
      const date = ts?.seconds ? new Date(ts.seconds * 1000) : null
      return date ? date >= start : false
    })
  }, [products, range, year])

  const total = useMemo(() => filtered.reduce((sum, p) => sum + (p.acquisitionPrice || 0), 0), [filtered])

  return (
    <div className="container-px py-6">
      <div className="mb-4 card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-600">Range:</span>
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="rounded-md border-neutral-300">
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="customYear">Year...</option>
            <option value="all">All</option>
          </select>
          {range === 'customYear' && (
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border-neutral-300">
              {[...new Set([new Date().getFullYear(), ...years])].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          <div className="ml-auto text-sm text-neutral-600">Count: {filtered.length} • Total: ₹{total}</div>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-600">
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Barcode</th>
              <th className="py-2 px-3">Brand</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="py-4 px-3" colSpan={5}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="py-4 px-3" colSpan={5}>No sold products</td></tr>
            ) : (
              filtered.map((p) => {
                const ts: any = (p as any).updatedAt
                const dt = ts?.seconds ? new Date(ts.seconds * 1000) : null
                const dateStr = dt ? dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString() : '—'
                return (
                  <tr key={p.id} className="border-t border-neutral-200">
                    <td className="py-2 px-3">{dateStr}</td>
                    <td className="py-2 px-3 font-mono">{p.barcode}</td>
                    <td className="py-2 px-3">{p.brand}</td>
                    <td className="py-2 px-3">{p.type}</td>
                    <td className="py-2 px-3">₹{p.acquisitionPrice}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Sales



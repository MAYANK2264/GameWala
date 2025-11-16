import { useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '../services/inventory'
import { fetchSales } from '../services/sales'
import { listRepairs } from '../services/repairs'
import { Link } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

export function Dashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [repairs, setRepairs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const products = await fetchProducts()
      setProducts(products)
      setSales(await fetchSales())
      setRepairs(await listRepairs())
      setLoading(false)
    }
    load()
  }, [])

  // Main KPIs
  const totalInventory = products.filter((p: any) => p.status !== 'sold').length
  const totalSold = sales.length
  const totalProfit = sales.reduce((sum: any, s: any) => sum + (s.profit || 0), 0)
  const repairsInProgress = repairs.filter((r: any) => r.status === 'In Progress').length
  const totalLoss = sales.reduce((sum: any, s: any) => sum + (s.profit < 0 ? s.profit : 0), 0) // always zero or negative

  // Top Product Type Sold
  const topType = useMemo(() => {
    const stat: Record<string, number> = {}
    sales.forEach((sale) => {
      const prod = products.find((p: any) => p.id === sale.productId)
      if (prod?.type) stat[prod.type] = (stat[prod.type] || 0) + 1
    })
    return Object.entries(stat).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }, [sales, products])
  // Top Seller
  const topSeller = useMemo(() => {
    const sellers: Record<string, number> = {}
    sales.forEach((sale) => {
      if (sale.soldBy) sellers[sale.soldBy] = (sellers[sale.soldBy] || 0) + 1
    })
    return Object.entries(sellers).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }, [sales])
  // Weekly Sales Trend (Last 8 days)
  const salesTrend = useMemo(() => {
    const days = Array.from({ length: 8 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d
    }).reverse()
    return days.map((d) => {
      const day = d.toISOString().slice(0, 10)
      const ct = sales.filter((s) => s.saleDate && s.saleDate.slice(0, 10) === day).length
      return { date: day.slice(5), count: ct }
    })
  }, [sales])
 // Weekly Repair Trend
  const repairsTrend = useMemo(() => {
    const days = Array.from({ length: 8 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d
    }).reverse()
    return days.map((d) => {
      const day = d.toISOString().slice(0, 10)
      const ct = repairs.filter((r) => r.receivedDate && r.receivedDate.slice(0, 10) === day).length
      return { date: day.slice(5), count: ct }
    })
  }, [repairs])

  return (
    <div className="container-px py-4 sm:py-6">
      <h1 className="text-2xl font-semibold mb-4 sm:mb-6">Dashboard</h1>
      
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Link
          to="/inventory"
          className="card flex flex-col justify-between gap-2 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          aria-label="View inventory"
        >
          <div className="text-xs sm:text-sm text-neutral-600">Total Inventory</div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900">{loading ? '…' : totalInventory}</div>
        </Link>
        <Link
          to="/sales-records"
          className="card flex flex-col justify-between gap-2 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          aria-label="View sales records"
        >
          <div className="text-xs sm:text-sm text-neutral-600">Total Sold</div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900">{loading ? '…' : totalSold}</div>
        </Link>
        <Link
          to="/reports"
          className="card flex flex-col justify-between gap-2 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          aria-label="View reports"
        >
          <div className="text-xs sm:text-sm text-neutral-600">Total Profit</div>
          <div
            className={`text-xl sm:text-2xl font-bold ${
              !loading && totalProfit > 0 ? 'text-green-600' : !loading && totalProfit === 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ₹{loading ? '…' : totalProfit}
          </div>
        </Link>
        <Link
          to="/repairs"
          className="card flex flex-col justify-between gap-2 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          aria-label="View repairs list"
        >
          <div className="text-xs sm:text-sm text-neutral-600">Repairs In Progress</div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900">{loading ? '…' : repairsInProgress}</div>
        </Link>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="card flex flex-col justify-between gap-2 rounded-lg p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-neutral-600">Top Type Sold</div>
          <div className="text-lg sm:text-xl font-bold text-neutral-900 truncate">{topType}</div>
        </div>
        <div className="card flex flex-col justify-between gap-2 rounded-lg p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-neutral-600">Top Seller</div>
          <div className="text-lg sm:text-xl font-bold text-neutral-900 truncate">{topSeller}</div>
        </div>
        <div className="card flex flex-col justify-between gap-2 rounded-lg p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-neutral-600">Total Loss</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{loading ? '…' : `₹${totalLoss}`}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="card flex flex-col rounded-lg p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-neutral-600 mb-3">Sales Last 7 Days</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={salesTrend}>
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card flex flex-col rounded-lg p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-neutral-600 mb-3">Repairs Last 7 Days</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={repairsTrend}>
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
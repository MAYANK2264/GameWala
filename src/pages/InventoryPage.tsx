import { useEffect, useMemo, useState, useRef } from 'react'
import type { Product } from '../types/product'
import { addProduct, deleteProduct, fetchProducts, updateProduct, updateProductStatus } from '../services/inventory'
import { createRepair } from '../services/repairs'
import { createSale } from '../services/sales';
import { storage } from '../firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import BarcodeLabel from '../components/BarcodeLabel'

type FormState = {
  barcode: string
  type: string
  brand: string
  condition: string
  acquisitionPrice: string
  acquiredDate: string
  acquiredFrom: string
  customerPhone: string; // NEW
  notes: string
}

const defaultForm = (): FormState => ({
  barcode: `P${Date.now()}`,
  type: '',
  brand: '',
  condition: 'new',
  acquisitionPrice: '',
  acquiredDate: new Date().toISOString().slice(0, 10),
  acquiredFrom: '',
  customerPhone: '', // NEW
  notes: '',
})

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [view, setView] = useState<'shop' | 'repair'>('shop')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<keyof Product>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchProducts()
      setProducts(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const base = products.filter(p =>
      [p.barcode, p.type, p.brand, p.condition, p.acquiredFrom, p.notes ?? '']
        .some(f => (f ?? '').toString().toLowerCase().includes(q)))
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey] as any
      const bv = b[sortKey] as any
      if (av === bv) return 0
      const res = av > bv ? 1 : -1
      return sortDir === 'asc' ? res : -res
    })
    return sorted
  }, [products, query, sortKey, sortDir])

  const repairProducts = filtered.filter(p => (p as any).status === 'in_repair' && (p as any).status !== 'sold');
  const shopProducts = filtered.filter(p => (p as any).status !== 'in_repair' && (p as any).status !== 'sold');

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm())
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      barcode: p.barcode,
      type: p.type,
      brand: p.brand,
      condition: p.condition,
      acquisitionPrice: String(p.acquisitionPrice ?? ''),
      acquiredDate: p.acquiredDate ?? new Date().toISOString().slice(0, 10),
      acquiredFrom: p.acquiredFrom ?? '',
      customerPhone: (p as any).customerPhone ?? '', // NEW
      notes: p.notes ?? '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!/^\d{10}$/.test(form.customerPhone)) {
      alert('Enter valid 10-digit phone number');
      return;
    }
    const payload = {
      barcode: form.barcode,
      type: form.type,
      brand: form.brand,
      condition: form.condition,
      acquisitionPrice: Number(form.acquisitionPrice) || 0,
      acquiredDate: form.acquiredDate,
      acquiredFrom: form.acquiredFrom,
      customerPhone: form.customerPhone, // NEW
      notes: form.notes || undefined,
      // New items go into the current section
      status: view === 'repair' ? 'in_repair' : 'available',
    }
    if (editingId) {
      // Keep status as-is when editing via this form; exclude status unless you want to change it here
      const { status, ...rest } = payload
      await updateProduct(editingId, rest)
    } else {
      await addProduct(payload)
    }
    setShowModal(false)
    setForm(defaultForm())
    const data = await fetchProducts()
    setProducts(data)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    const data = await fetchProducts()
    setProducts(data)
  }

  const sortBy = (key: keyof Product) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const changeStatus = async (p: Product, newStatus: string) => {
    await updateProductStatus(p.id, newStatus)
    const data = await fetchProducts()
    setProducts(data)
  }

  // Start Repair with note + voice note (modal)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [repairNote, setRepairNote] = useState('')
  const [recording, setRecording] = useState<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const [repairFor, setRepairFor] = useState<Product | null>(null)
  const [repairCustomerName, setRepairCustomerName] = useState(''); // NEW
  const [repairCustomerPhone, setRepairCustomerPhone] = useState(''); // NEW

  const startRepair = async (p: Product) => {
    setRepairFor(p)
    setRepairCustomerName('')
    setRepairCustomerPhone('')
    setRepairNote('')
    setAudioBlob(null)
    setShowRepairModal(true)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      audioChunks.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
      }
      rec.start()
      setRecording(rec)
    } catch {}
  }

  const stopRecording = () => {
    recording?.stop()
    setRecording(null)
  }

  const submitRepair = async () => {
    if (!repairFor || !repairCustomerName.trim() || !/^\d{10}$/.test(repairCustomerPhone)) {
      alert('Customer name and valid 10-digit phone required');
      return;
    }
    const rid = await createRepair({
      productId: repairFor.id,
      customerName: repairCustomerName.trim(),
      customerPhone: repairCustomerPhone.trim(), // NEW
      receivedDate: new Date().toISOString().slice(0,10),
      expectedDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10),
      faultDescription: repairNote || 'N/A',
      status: 'Received',
      estimate: Number(repairFor.acquisitionPrice) || 0,
      assignedTo: '',
      notes: repairNote || undefined,
    } as any)
    if (audioBlob) {
      const fileRef = ref(storage, `repairs/${rid}.webm`)
      await uploadBytes(fileRef, audioBlob)
      const url = await getDownloadURL(fileRef)
      // simple patch: update via repairs service updateRepair is in repairs.ts; reuse by dynamic import
      try {
        const { updateRepair } = await import('../services/repairs')
        await updateRepair(rid, { voiceNoteUrl: url })
      } catch {}
    }
    await changeStatus(repairFor, 'in_repair')
    setShowRepairModal(false)
    setRepairCustomerName('');
    setRepairCustomerPhone(''); // reset
    setRepairNote('');
    setAudioBlob(null);
  }

  const [showSellModal, setShowSellModal] = useState(false);
  const [sellPrice, setSellPrice] = useState('');
  const [sellFor, setSellFor] = useState<Product | null>(null);
  const [soldBy, setSoldBy] = useState('');

  const openSell = (p: Product) => {
    setSellFor(p);
    setSellPrice('');
    setSoldBy('');
    setShowSellModal(true);
  };

  const submitSell = async () => {
    if (!sellFor || !sellPrice) return;
    const now = new Date().toISOString();
    const price = Number(sellPrice);
    const acquisitionPrice = Number(sellFor.acquisitionPrice);
    await createSale({
      productId: sellFor.id,
      saleDate: now,
      salePrice: price,
      acquisitionPrice,
      profit: price - acquisitionPrice,
      soldBy: soldBy || '—',
    });
    await updateProduct(sellFor.id, {
      status: 'sold',
    });
    setShowSellModal(false);
    setSellFor(null);
    setSellPrice('');
    setSoldBy('');
    const data = await fetchProducts();
    setProducts(data);
  };

  return (
    <div className="container-px py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base sm:w-80"
          inputMode="search"
        />
        <button
          type="button"
          onClick={openAdd}
          className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition hover:opacity-90"
        >
          Add Product
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`touch-target inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition ${
              view === 'shop' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'
            }`}
            onClick={() => setView('shop')}
            type="button"
            aria-pressed={view === 'shop'}
          >
            In Shop
          </button>
          <button
            className={`touch-target inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition ${
              view === 'repair' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'
            }`}
            onClick={() => setView('repair')}
            type="button"
            aria-pressed={view === 'repair'}
          >
            In Repair
          </button>
        </div>
      </div>
      {view === 'shop' && (
      <div className="card mb-6 p-4">
        <div className="mb-2 text-lg font-semibold">Shop Inventory</div>
        <div className="space-y-3 sm:hidden">
          {loading ? (
            <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">Loading…</div>
          ) : shopProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
              No products
            </div>
          ) : (
            shopProducts.map((p) => (
              <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{p.brand || 'Unnamed product'}</div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">{p.type || '—'}</div>
                  </div>
                  <div className="text-right text-sm text-neutral-600">
                    <div className="font-mono text-base">{p.barcode}</div>
                    <div>₹{p.acquisitionPrice}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-neutral-500">
                  <div>
                    <span className="block text-neutral-400">Condition</span>
                    <span className="text-neutral-700">{p.condition}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">Acquired</span>
                    <span className="text-neutral-700">{p.acquiredDate}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">From</span>
                    <span className="text-neutral-700">{p.acquiredFrom || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">Status</span>
                    <span className="text-neutral-700">{(p as any).status ?? 'available'}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <BarcodeLabel code={p.barcode} brand={p.brand} productType={p.type} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="touch-target inline-flex flex-1 items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => startRepair(p)}
                    className="touch-target inline-flex flex-1 items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                  >
                    Repair
                  </button>
                  <button
                    type="button"
                    onClick={() => openSell(p)}
                    className="touch-target inline-flex flex-1 items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    Sell
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="touch-target inline-flex flex-1 items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto -mx-4 sm:mx-0 sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-600">
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('barcode')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Barcode
                </button>
              </th>
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('brand')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Brand
                </button>
              </th>
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('type')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Type
                </button>
              </th>
              <th scope="col" className="py-2 px-3">Condition</th>
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('acquiredDate')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Acquired
                </button>
              </th>
              <th scope="col" className="py-2 px-3">From</th>
              <th scope="col" className="py-2 px-3">Price</th>
              <th scope="col" className="py-2 px-3">Status</th>
              <th scope="col" className="py-2 px-3">Barcode</th>
              <th scope="col" className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="py-4 px-3" colSpan={10}>Loading...</td></tr>
            ) : shopProducts.length === 0 ? (
              <tr><td className="py-4 px-3" colSpan={10}>No products</td></tr>
            ) : (
              shopProducts.map(p => (
                <tr key={p.id} className="border-t border-neutral-200">
                  <td className="py-2 px-3 font-mono">{p.barcode}</td>
                  <td className="py-2 px-3">{p.brand}</td>
                  <td className="py-2 px-3">{p.type}</td>
                  <td className="py-2 px-3">{p.condition}</td>
                  <td className="py-2 px-3">{p.acquiredDate}</td>
                  <td className="py-2 px-3">{p.acquiredFrom}</td>
                  <td className="py-2 px-3">₹{p.acquisitionPrice}</td>
                  <td className="py-2 px-3">
                    <select value={(p as any).status ?? 'available'} onChange={(e) => changeStatus(p, e.target.value)} className="rounded-md border-neutral-300">
                      <option value="available">available</option>
                      <option value="in_repair">in_repair</option>
                      <option value="sold">sold</option>
                    </select>
                  </td>
                  <td className="py-2 px-3"><BarcodeLabel code={p.barcode} brand={p.brand} productType={p.type} /></td>
                  <td className="py-2 px-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => startRepair(p)}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700"
                    >
                      Start Repair
                    </button>
                    <button
                      type="button"
                      onClick={() => openSell(p)}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700"
                    >
                      Mark Sold
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
       </div>
      </div>
      )}

      {view === 'repair' && (
      <div className="card p-4">
        <div className="mb-2 text-lg font-semibold">In Repair</div>
        <div className="space-y-3 sm:hidden">
          {loading ? (
            <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">Loading…</div>
          ) : repairProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
              No products
            </div>
          ) : (
            repairProducts.map((p) => (
              <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{p.brand || 'Unnamed product'}</div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">{p.type || '—'}</div>
                  </div>
                  <div className="text-right text-sm text-neutral-600">
                    <div className="font-mono text-base">{p.barcode}</div>
                    <div>₹{p.acquisitionPrice}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-neutral-500">
                  <div>
                    <span className="block text-neutral-400">Condition</span>
                    <span className="text-neutral-700">{p.condition}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">Acquired</span>
                    <span className="text-neutral-700">{p.acquiredDate}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">From</span>
                    <span className="text-neutral-700">{p.acquiredFrom || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400">Status</span>
                    <span className="text-neutral-700">{(p as any).status ?? 'in_repair'}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <BarcodeLabel code={p.barcode} brand={p.brand} productType={p.type} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="touch-target inline-flex flex-1 items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="touch-target inline-flex flex-1 items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto -mx-4 sm:mx-0 sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-600">
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('barcode')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Barcode
                </button>
              </th>
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('brand')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Brand
                </button>
              </th>
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('type')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Type
                </button>
              </th>
              <th scope="col" className="py-2 px-3">Condition</th>
              <th scope="col" className="py-2 px-3">
                <button
                  type="button"
                  onClick={() => sortBy('acquiredDate')}
                  className="touch-target inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  Acquired
                </button>
              </th>
              <th scope="col" className="py-2 px-3">From</th>
              <th scope="col" className="py-2 px-3">Price</th>
              <th scope="col" className="py-2 px-3">Status</th>
              <th scope="col" className="py-2 px-3">Barcode</th>
              <th scope="col" className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="py-4 px-3" colSpan={10}>Loading...</td></tr>
            ) : repairProducts.length === 0 ? (
              <tr><td className="py-4 px-3" colSpan={10}>No products</td></tr>
            ) : (
              repairProducts.map(p => (
                <tr key={p.id} className="border-t border-neutral-200">
                  <td className="py-2 px-3 font-mono">{p.barcode}</td>
                  <td className="py-2 px-3">{p.brand}</td>
                  <td className="py-2 px-3">{p.type}</td>
                  <td className="py-2 px-3">{p.condition}</td>
                  <td className="py-2 px-3">{p.acquiredDate}</td>
                  <td className="py-2 px-3">{p.acquiredFrom}</td>
                  <td className="py-2 px-3">₹{p.acquisitionPrice}</td>
                  <td className="py-2 px-3">
                    <select value={(p as any).status ?? 'in_repair'} onChange={(e) => changeStatus(p, e.target.value)} className="rounded-md border-neutral-300">
                      <option value="available">available</option>
                      <option value="in_repair">in_repair</option>
                      <option value="sold">sold</option>
                    </select>
                  </td>
                  <td className="py-2 px-3"><BarcodeLabel code={p.barcode} brand={p.brand} productType={p.type} /></td>
                  <td className="py-2 px-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="touch-target inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
       </div>
      </div>
      )}

       {showModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="modal-content w-full max-w-2xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div className="text-lg font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="touch-target rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Barcode</label>
                <input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Type</label>
                <input
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                >
                  <option value="new">new</option>
                  <option value="used">used</option>
                  <option value="refurbished">refurbished</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Acquired Date</label>
                <input
                  type="date"
                  value={form.acquiredDate}
                  onChange={(e) => setForm({ ...form, acquiredDate: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Acquisition Price</label>
                <input
                  type="number"
                  value={form.acquisitionPrice}
                  onChange={(e) => setForm({ ...form, acquisitionPrice: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Acquired From</label>
                <input
                  value={form.acquiredFrom}
                  onChange={(e) => setForm({ ...form, acquiredFrom: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Phone Number</label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  placeholder="10 digit phone"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-medium text-neutral-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 p-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="touch-target rounded-md border border-neutral-200 bg-white px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition hover:opacity-90"
              >
                {editingId ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

       {showRepairModal && (
         <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
           <div className="modal-content w-full max-w-lg rounded-lg bg-white shadow-lg">
             <div className="flex items-center justify-between border-b border-neutral-200 p-4">
               <div className="text-lg font-semibold">Start Repair</div>
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
                 <label className="text-sm font-medium text-neutral-700">Notes (fault description)</label>
                 <textarea
                   value={repairNote}
                   onChange={(e) => setRepairNote(e.target.value)}
                   className="w-full rounded-md border border-neutral-300 px-3 py-2"
                   rows={4}
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
               <div className="space-y-1">
                 <label className="text-sm font-medium text-neutral-700">Customer Name *</label>
                 <input
                   value={repairCustomerName}
                   onChange={(e) => setRepairCustomerName(e.target.value)}
                   className="w-full rounded-md border border-neutral-300 px-3 py-2"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-neutral-700">Customer Phone Number *</label>
                 <input
                   type="tel"
                   value={repairCustomerPhone}
                   onChange={(e) => setRepairCustomerPhone(e.target.value)}
                   className="w-full rounded-md border border-neutral-300 px-3 py-2"
                   placeholder="10 digit phone"
                   maxLength={10}
                   pattern="[0-9]{10}"
                   inputMode="numeric"
                 />
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

       {showSellModal && (
         <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
           <div className="modal-content w-full max-w-sm rounded-lg bg-white shadow-lg">
             <div className="flex items-center justify-between border-b border-neutral-200 p-4">
               <div className="text-lg font-semibold">
                 Sell Product — {sellFor?.brand} {sellFor?.type}
               </div>
               <button
                 type="button"
                 onClick={() => setShowSellModal(false)}
                 className="touch-target rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
               >
                 Close
               </button>
             </div>
             <div className="space-y-3 p-4">
               <div className="space-y-1">
                 <label className="text-sm font-medium text-neutral-700">Sale Price (₹) *</label>
                 <input
                   type="number"
                   value={sellPrice}
                   onChange={(e) => setSellPrice(e.target.value)}
                   className="w-full rounded-md border border-neutral-300 px-3 py-2"
                   min={0}
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-neutral-700">Sold By</label>
                 <input
                   value={soldBy}
                   onChange={(e) => setSoldBy(e.target.value)}
                   className="w-full rounded-md border border-neutral-300 px-3 py-2"
                   placeholder="Employee name (optional)"
                 />
               </div>
             </div>
             <div className="flex justify-end gap-2 border-t border-neutral-200 p-4">
               <button
                 type="button"
                 onClick={() => setShowSellModal(false)}
                 className="touch-target rounded-md border border-neutral-200 bg-white px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-100"
               >
                 Cancel
               </button>
               <button
                 type="button"
                 onClick={submitSell}
                 className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition hover:opacity-90"
               >
                 Confirm Sale
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  )
}



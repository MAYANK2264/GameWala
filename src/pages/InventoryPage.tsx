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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full sm:w-80 rounded-md border-neutral-300"
        />
        <button onClick={openAdd} className="px-3 py-2 rounded-md bg-neutral-900 text-white">Add Product</button>
        <div className="flex items-center gap-1 ml-auto">
          <button
            className={[
              'px-3 py-2 rounded-md text-sm',
              view === 'shop' ? 'bg-neutral-900 text-white' : 'bg-neutral-200'
            ].join(' ')}
            onClick={() => setView('shop')}
            type="button"
          >
            In Shop
          </button>
          <button
            className={[
              'px-3 py-2 rounded-md text-sm',
              view === 'repair' ? 'bg-neutral-900 text-white' : 'bg-neutral-200'
            ].join(' ')}
            onClick={() => setView('repair')}
            type="button"
          >
            In Repair
          </button>
        </div>
      </div>
      {view === 'shop' && (
      <div className="card p-4 mb-6">
        <div className="font-semibold mb-2">Shop Inventory</div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-600">
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('barcode')}>Barcode</th>
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('brand')}>Brand</th>
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('type')}>Type</th>
              <th className="py-2 px-3">Condition</th>
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('acquiredDate')}>Acquired</th>
              <th className="py-2 px-3">From</th>
              <th className="py-2 px-3">Price</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Barcode</th>
              <th className="py-2 px-3">Actions</th>
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
                    <button onClick={() => openEdit(p)} className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300">Edit</button>
                    <button onClick={() => startRepair(p)} className="px-2 py-1 rounded bg-amber-600 text-white hover:opacity-90">Start Repair</button>
                    <button onClick={() => openSell(p)} className="px-2 py-1 rounded bg-green-600 text-white hover:opacity-90">Mark Sold</button>
                    <button onClick={() => handleDelete(p.id)} className="px-2 py-1 rounded bg-red-600 text-white hover:opacity-90">Delete</button>
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
        <div className="font-semibold mb-2">In Repair</div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-600">
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('barcode')}>Barcode</th>
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('brand')}>Brand</th>
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('type')}>Type</th>
              <th className="py-2 px-3">Condition</th>
              <th className="py-2 px-3 cursor-pointer" onClick={() => sortBy('acquiredDate')}>Acquired</th>
              <th className="py-2 px-3">From</th>
              <th className="py-2 px-3">Price</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Barcode</th>
              <th className="py-2 px-3">Actions</th>
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
                    <button onClick={() => openEdit(p)} className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="px-2 py-1 rounded bg-red-600 text-white hover:opacity-90">Delete</button>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</div>
              <button onClick={() => setShowModal(false)} className="px-2 py-1 rounded bg-neutral-200">Close</button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-600">Barcode</label>
                <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="w-full rounded-md border-neutral-300" />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Brand</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded-md border-neutral-300" />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Type</label>
                <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border-neutral-300" />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Condition</label>
                <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full rounded-md border-neutral-300">
                  <option value="new">new</option>
                  <option value="used">used</option>
                  <option value="refurbished">refurbished</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-600">Acquired Date</label>
                <input type="date" value={form.acquiredDate} onChange={(e) => setForm({ ...form, acquiredDate: e.target.value })} className="w-full rounded-md border-neutral-300" />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Acquisition Price</label>
                <input type="number" value={form.acquisitionPrice} onChange={(e) => setForm({ ...form, acquisitionPrice: e.target.value })} className="w-full rounded-md border-neutral-300" />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Acquired From</label>
                <input value={form.acquiredFrom} onChange={(e) => setForm({ ...form, acquiredFrom: e.target.value })} className="w-full rounded-md border-neutral-300" />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Phone Number</label>
                <input type="tel"
                  value={form.customerPhone}
                  onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full rounded-md border-neutral-300"
                  placeholder="10 digit phone"
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-neutral-600">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-md border-neutral-300" rows={3} />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-2 rounded-md bg-neutral-200">Cancel</button>
              <button onClick={handleSubmit} className="px-3 py-2 rounded-md bg-neutral-900 text-white">{editingId ? 'Save Changes' : 'Add Product'}</button>
            </div>
          </div>
        </div>
      )}

       {showRepairModal && (
         <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg w-full max-w-lg shadow-lg">
             <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
               <div className="font-semibold">Start Repair</div>
               <button onClick={() => setShowRepairModal(false)} className="px-2 py-1 rounded bg-neutral-200">Close</button>
             </div>
             <div className="p-4 space-y-3">
               <div>
                 <label className="text-xs text-neutral-600">Notes (fault description)</label>
                 <textarea value={repairNote} onChange={(e) => setRepairNote(e.target.value)} className="w-full rounded-md border-neutral-300" rows={4} />
               </div>
               <div>
                 <div className="text-xs text-neutral-600 mb-1">Voice Note (optional)</div>
                 <div className="flex items-center gap-2">
                   {!recording && <button onClick={startRecording} className="px-3 py-2 rounded-md bg-neutral-900 text-white">Record</button>}
                   {recording && <button onClick={stopRecording} className="px-3 py-2 rounded-md bg-red-600 text-white">Stop</button>}
                   {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
                 </div>
               </div>
               <div>
                 <label className="text-xs text-neutral-600">Customer Name *</label>
                 <input value={repairCustomerName} onChange={e => setRepairCustomerName(e.target.value)} className="w-full rounded-md border-neutral-300" />
               </div>
               <div>
                 <label className="text-xs text-neutral-600">Customer Phone Number *</label>
                 <input type="tel"
                   value={repairCustomerPhone}
                   onChange={e => setRepairCustomerPhone(e.target.value)}
                   className="w-full rounded-md border-neutral-300"
                   placeholder="10 digit phone"
                   maxLength={10}
                   pattern="[0-9]{10}"
                 />
               </div>
             </div>
             <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
               <button onClick={() => setShowRepairModal(false)} className="px-3 py-2 rounded-md bg-neutral-200">Cancel</button>
               <button onClick={submitRepair} className="px-3 py-2 rounded-md bg-neutral-900 text-white">Create Repair</button>
             </div>
           </div>
         </div>
       )}

       {showSellModal && (
         <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg w-full max-w-sm shadow-lg">
             <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
               <div className="font-semibold">Sell Product — {sellFor?.brand} {sellFor?.type}</div>
               <button onClick={() => setShowSellModal(false)} className="px-2 py-1 rounded bg-neutral-200">Close</button>
             </div>
             <div className="p-4 space-y-3">
               <div>
                 <label className="text-xs text-neutral-600">Sale Price (₹) *</label>
                 <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} className="w-full rounded-md border-neutral-300" />
               </div>
               <div>
                 <label className="text-xs text-neutral-600">Sold By</label>
                 <input value={soldBy} onChange={e => setSoldBy(e.target.value)} className="w-full rounded-md border-neutral-300" placeholder="Employee name (optional)" />
               </div>
             </div>
             <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
               <button onClick={() => setShowSellModal(false)} className="px-3 py-2 rounded-md bg-neutral-200">Cancel</button>
               <button onClick={submitSell} className="px-3 py-2 rounded-md bg-neutral-900 text-white">Confirm Sale</button>
             </div>
           </div>
         </div>
       )}
    </div>
  )
}



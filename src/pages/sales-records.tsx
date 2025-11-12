import { useEffect, useState } from 'react';
import { fetchSales } from '../services/sales';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import useAuth from '../hooks/useAuth';

export default function SalesRecords() {
  const { role } = useAuth(); // required for admin check
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any|null>(null);
  const [editForm, setEditForm] = useState({ salePrice: '', soldBy: '' });

  useEffect(() => { (async()=>{
    setLoading(true);
    setSales((await fetchSales()).sort((a,b)=>b.saleDate.localeCompare(a.saleDate)));
    setLoading(false);
  })(); }, []);

  // Export to CSV helper
  const exportCSV = () => {
    const headers = ['Date','Barcode','Price','Acquisition','Profit','Sold By'];
    const rows = sales.map(sale => [
      sale.saleDate,
      sale.productId,
      sale.salePrice,
      sale.acquisitionPrice,
      sale.profit,
      sale.soldBy||''
    ]);
    let csv = headers.join(',')+'\n'+rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales.csv'; a.click();
    window.URL.revokeObjectURL(url);
  };

  const openEdit = (sale:any) => {
    setEditing(sale);
    setEditForm({ salePrice: String(sale.salePrice), soldBy: sale.soldBy||'' });
  };
  const submitEdit = async () => {
    if (!editing) return;
    const ref = doc(db, 'sales', editing.id);
    const newPrice = Number(editForm.salePrice);
    const profit = newPrice - (editing.acquisitionPrice||0);
    await updateDoc(ref, { salePrice: newPrice, soldBy: editForm.soldBy, profit });
    setSales(sales => sales.map(s =>
      s.id === editing.id ? { ...s, salePrice: newPrice, soldBy: editForm.soldBy, profit } : s
    ));
    setEditing(null);
  };
  const del = async (sale:any) => {
    if (!window.confirm('Delete this sale record?')) return;
    await deleteDoc(doc(db, 'sales', sale.id));
    setSales(sales=>sales.filter(s=>s.id!==sale.id));
  };
  return (
    <div className="container-px py-6">
      {role==="owner" && (
        <div className="mb-4">
        <button
          type="button"
          onClick={exportCSV}
          className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Export CSV
        </button>
        </div>
      )}
      <div className="card p-6 mb-8">
        <div className="text-lg font-bold mb-2">Sale Records</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-600">
                <th>Date</th><th>Barcode</th><th>Price</th><th>Acquisition</th><th>Profit</th><th>Sold By</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center">Loading...</td></tr>
              ) : sales.length===0 ? (
                <tr><td colSpan={7} className="py-8 text-center">No sales</td></tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="border-t border-neutral-200">
                    <td>{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : '-'}</td>
                    <td>{sale.productId}</td>
                    <td>₹{sale.salePrice}</td>
                    <td>₹{sale.acquisitionPrice}</td>
                    <td className={sale.profit > 0 ? 'text-green-700' : 'text-red-700'}>₹{sale.profit}</td>
                    <td>{sale.soldBy||''}</td>
                    <td className="space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(sale)}
                        className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => del(sale)}
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
      {editing && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="modal-content w-full max-w-md rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div className="text-lg font-semibold">Edit Sale</div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="touch-target inline-flex items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Sale Price (₹)</label>
                <input
                  type="number"
                  value={editForm.salePrice}
                  onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Sold By</label>
                <input
                  value={editForm.soldBy}
                  onChange={(e) => setEditForm({ ...editForm, soldBy: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 p-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="touch-target rounded-md border border-neutral-200 bg-white px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEdit}
                className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

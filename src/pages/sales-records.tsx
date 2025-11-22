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
          <button onClick={exportCSV} className="px-3 py-2 rounded bg-neutral-900 text-white">Export CSV</button>
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
                    <td>
                      <button onClick={()=>openEdit(sale)} className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300 mr-1 text-xs">Edit</button>
                      <button onClick={()=>del(sale)} className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:opacity-90">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="font-semibold">Edit Sale</div>
              <button onClick={()=>setEditing(null)} className="px-2 py-1 rounded bg-neutral-200">Close</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-neutral-600">Sale Price (₹)</label>
                <input type="number" value={editForm.salePrice} onChange={e=>setEditForm({...editForm,salePrice:e.target.value})} className="w-full rounded-md border-neutral-300"/>
              </div>
              <div>
                <label className="text-xs text-neutral-600">Sold By</label>
                <input value={editForm.soldBy} onChange={e=>setEditForm({...editForm,soldBy:e.target.value})} className="w-full rounded-md border-neutral-300"/>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <button onClick={()=>setEditing(null)} className="px-3 py-2 rounded-md bg-neutral-200">Cancel</button>
              <button onClick={submitEdit} className="px-3 py-2 rounded-md bg-neutral-900 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

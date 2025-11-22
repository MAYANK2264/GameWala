import { useEffect, useState } from 'react';
import { fetchSales } from '../services/sales';
import { fetchProducts } from '../services/inventory';
import { listRepairs } from '../services/repairs';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from 'recharts';
import useAuth from '../hooks/useAuth';

const COLORS=['#a78bfa','#fbbf24','#34d399','#38bdf8','#f472b6','#fb7185','#f87171','#60a5fa'];

export function Reports() {
  const { role } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  useEffect(() => { (async()=>{
    setSales(await fetchSales());
    setProducts(await fetchProducts());
    setRepairs(await listRepairs());
  })(); }, []);

  // Monthly Profit
  const profitByMonth = (()=>{
    const m:Record<string,number> = {};
    sales.forEach(s => {
      const dt=new Date(s.saleDate), key=`${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}`;
      m[key]=(m[key]||0)+(s.profit||0);
    });
    return Object.entries(m).map(([key,value])=>({ month:key, profit:value })).sort((a,b)=>a.month.localeCompare(b.month));
  })();

  // Product Type Distribution
  const typeCount = (()=>{
    const m:Record<string,number> = {};
    products.forEach(p=>{if(p.type)m[p.type]=(m[p.type]||0)+1;});
    return Object.entries(m).map(([key,value])=>({ name:key, value }));
  })();

  // Repairs per month
  const repairBar = (()=>{
    const m:Record<string,number> = {};
    repairs.forEach(r=>{
      const dt=new Date(r.receivedDate||r.expectedDate), key=`${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}`;
      m[key]=(m[key]||0)+1;
    });
    return Object.entries(m).map(([key,value])=>({ month:key, count:value })).sort((a,b)=>a.month.localeCompare(b.month));
  })();

  // EXPORT
  const exportCSV = () => {
    // Export profitByMonth and typeCount as separate CSVs
    let out = 'Month,Profit\n'+profitByMonth.map(i=>`${i.month},${i.profit}`).join('\n');
    out += '\n\nType,Count\n'+typeCount.map(i=>`${i.name},${i.value}`).join('\n');
    const blob = new Blob([out], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download='reports.csv'; a.click(); window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container-px py-6 space-y-8">
      {role==="owner"&&(
        <div className="my-4">
          <button onClick={exportCSV} className="px-3 py-2 rounded bg-neutral-900 text-white">Export CSV</button>
        </div>
      )}
      <div className="card p-6">
        <div className="font-semibold mb-2">Monthly Profit</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={profitByMonth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2}/></LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card p-6 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2">
          <div className="font-semibold mb-2">Product Type Distribution</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={typeCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {typeCount.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
              </Pie>
              <PieTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2">
          <div className="font-semibold mb-2">Repair Count (per Month)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={repairBar}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Legend/><Bar dataKey="count" fill="#60a5fa" /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Reports;



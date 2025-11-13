import { Routes, Route, Navigate } from 'react-router-dom'
import TopNav from './components/TopNav'
import { Login, Dashboard, InventoryPage, Repairs, ScanPage, Sales, Reports, Settings } from './pages'
import './index.css'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container-px py-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4rem)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="space-y-4">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
              <Route path="/repairs" element={<PrivateRoute><Repairs /></PrivateRoute>} />
              <Route path="/scan" element={<PrivateRoute><ScanPage /></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute allowedRoles={["owner"]}><Settings /></PrivateRoute>} />
              <Route path="*" element={<div className="card p-6">Not Found</div>} />
            </Routes>
          </div>
        </div>
      </main>
      <footer className="border-t border-neutral-200 bg-white">
        <div className="container-px py-4 text-sm text-neutral-500">
          © {new Date().getFullYear()} GameWala
        </div>
      </footer>
    </div>
  )
}

export default App

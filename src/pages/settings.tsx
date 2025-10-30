import { useEffect, useState } from 'react'
import useAuth, { type UserRole } from '../hooks/useAuth'
import { db } from '../firebaseConfig'
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore'

type ManagedUser = {
  uid: string
  email: string | null
  displayName: string | null
  role: UserRole
  active?: boolean
}

export function Settings() {
  const { role: myRole, user } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const isOwner = myRole === 'owner'

  useEffect(() => {
    if (!isOwner) return
    const load = async () => {
      setLoading(true)
      const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      const list: ManagedUser[] = snap.docs.map(d => {
        const data = d.data() as any
        return {
          uid: data.uid ?? d.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          role: (data.role ?? 'pending') as UserRole,
          active: data.active !== false,
        }
      })
      setUsers(list)
      setLoading(false)
    }
    load()
  }, [isOwner])

  const handleChangeRole = async (uid: string, newRole: UserRole) => {
    await updateDoc(doc(db, 'users', uid), { role: newRole })
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u))
  }

  const handleToggleActive = async (uid: string, active: boolean) => {
    await updateDoc(doc(db, 'users', uid), { active })
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, active } : u))
  }

  if (!isOwner) {
    return (
      <div className="container-px py-6">
        <div className="card p-6">
          <div className="font-semibold mb-1">Settings</div>
          <div className="text-sm text-neutral-600">Only owners can manage users.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-px py-6">
      <div className="space-y-4">
        <div className="card p-6">
          <div className="font-semibold mb-4">User Management</div>
          {loading ? (
            <div>Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.uid} className="border-t border-neutral-200">
                      <td className="py-2 pr-4">{u.displayName ?? '—'}</td>
                      <td className="py-2 pr-4">{u.email ?? '—'}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.uid, e.target.value as UserRole)}
                          className="rounded-md border-neutral-300"
                          disabled={u.uid === user?.uid}
                        >
                          <option value="pending">pending</option>
                          <option value="staff">staff</option>
                          <option value="owner">owner</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">{u.active !== false ? 'active' : 'inactive'}</td>
                      <td className="py-2 pr-4 space-x-2">
                        {u.active !== false ? (
                          <button
                            onClick={() => handleToggleActive(u.uid, false)}
                            className="px-3 py-1 rounded-md bg-neutral-200 hover:bg-neutral-300"
                            disabled={u.uid === user?.uid}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(u.uid, true)}
                            className="px-3 py-1 rounded-md bg-neutral-900 text-white hover:opacity-90"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

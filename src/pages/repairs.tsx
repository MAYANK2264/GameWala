import { useEffect, useMemo, useState } from 'react'
import type { Repair, RepairStatus } from '../types/repair'
import { listRepairs, updateRepair } from '../services/repairs'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'

const STATUSES: RepairStatus[] = ['Received', 'In Progress', 'Repaired', 'Delivered']

export function Repairs() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [assignee, setAssignee] = useState('')
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null)
  const [editForm, setEditForm] = useState({ assignedTo: '', estimate: '', actualCost: '', productProcedure: '' })

  useEffect(() => {
    const load = async () => {
      const data = await listRepairs(assignee || undefined)
      setRepairs(data)
    }
    load()
  }, [assignee])

  const grouped = useMemo(() => {
    const map: Record<RepairStatus, Repair[]> = { 'Received': [], 'In Progress': [], 'Repaired': [], 'Delivered': [] }
    for (const r of repairs) map[r.status].push(r)
    return map
  }, [repairs])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    const destStatus = destination.droppableId as RepairStatus
    const srcStatus = source.droppableId as RepairStatus
    if (destStatus === srcStatus) return
    await updateRepair(draggableId, { status: destStatus })
    setRepairs(prev => prev.map(r => r.id === draggableId ? { ...r, status: destStatus } : r))
  }

  const assignees = Array.from(new Set(repairs.map(r => r.assignedTo).filter(Boolean)))

  const openEdit = (r: Repair) => {
    setEditingRepair(r)
    setEditForm({
      assignedTo: r.assignedTo || '',
      estimate: String(r.estimate || ''),
      actualCost: String(r.actualCost || ''),
      productProcedure: r.productProcedure || '',
    })
  }

  const submitEdit = async () => {
    if (!editingRepair) return;
    const update: any = {
      assignedTo: editForm.assignedTo,
      estimate: Number(editForm.estimate) || 0,
      productProcedure: editForm.productProcedure || undefined,
    };
    if (editForm.actualCost && editForm.actualCost !== '') {
      update.actualCost = Number(editForm.actualCost);
    }
    await updateRepair(editingRepair.id, update);
    setRepairs(prev => prev.map(r => r.id === editingRepair.id ? {
      ...r,
      ...update,
    } : r));
    setEditingRepair(null);
  }

  return (
    <div className="container-px py-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-sm text-neutral-600">Filter by assignee:</div>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="rounded-md border-neutral-300">
          <option value="">All</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map(status => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="card p-4 min-h-[320px]">
                  <div className="font-semibold mb-2 flex items-center justify-between">
                    <span>{status}</span>
                    <span className="text-xs text-neutral-600">{grouped[status]?.length ?? 0}</span>
                  </div>
                  {(grouped[status] ?? []).map((r, idx) => (
                    <Draggable key={r.id} draggableId={r.id} index={idx}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className="mb-2 rounded-md border border-neutral-200 p-3 bg-white">
                          <div className="text-sm font-medium">{r.customerName || 'N/A'}</div>
                          <div className="text-xs text-neutral-600">Product: {r.productId}</div>
                          <div className="text-xs text-neutral-600">Assigned: {r.assignedTo || '—'}</div>
                          <div className="text-xs text-neutral-600">ETA: {r.expectedDate}</div>
                          <div className="text-xs text-neutral-600">Estimate: ₹{r.estimate}</div>
                          {r.status === 'Delivered' && r.actualCost && <div className="text-xs text-green-600">Actual Cost: ₹{r.actualCost}</div>}
                          {r.productProcedure && <div className="text-xs text-neutral-700 mt-1">Procedure: {r.productProcedure}</div>}
                          {r.notes && <div className="text-xs text-neutral-700 mt-1">Note: {r.notes}</div>}
                          {r.voiceNoteUrl && (
                            <div className="mt-1">
                              <audio controls src={r.voiceNoteUrl} className="w-full" />
                            </div>
                          )}
                          <div className="mt-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-300"
                            >
                              Edit
                            </button>
                            <select
                              className="flex-1 rounded-md border border-neutral-300 px-2 py-2 text-xs"
                              value={r.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value as RepairStatus
                                await updateRepair(r.id, { status: newStatus })
                                setRepairs(prev => prev.map(item => item.id === r.id ? { ...item, status: newStatus } : item))
                              }}
                            >
                              <option value="Received">Received</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Repaired">Repaired</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {editingRepair && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="modal-content w-full max-w-lg rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div className="text-lg font-semibold">Edit Repair — {editingRepair.customerName}</div>
              <button
                type="button"
                onClick={() => setEditingRepair(null)}
                className="touch-target rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Assigned Technician</label>
                <input
                  value={editForm.assignedTo}
                  onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  placeholder="Technician name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={editForm.estimate}
                  onChange={(e) => setEditForm({ ...editForm, estimate: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">
                  Actual Cost (₹) {editingRepair.status === 'Delivered' ? '(paid by customer)' : '(optional)'}
                </label>
                <input
                  type="number"
                  value={editForm.actualCost}
                  onChange={(e) => setEditForm({ ...editForm, actualCost: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Product Procedure</label>
                <textarea
                  value={editForm.productProcedure}
                  onChange={(e) => setEditForm({ ...editForm, productProcedure: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  rows={4}
                  placeholder="Describe the repair procedure…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 p-4">
              <button
                type="button"
                onClick={() => setEditingRepair(null)}
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
  )
}

export default Repairs



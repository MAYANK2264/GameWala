import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Repair } from '../types/repair'

const REPAIRS = 'repairs'

type NewRepairInput = Omit<Repair, 'id'>

export async function createRepair(data: NewRepairInput) {
  const ref = await addDoc(collection(db, REPAIRS), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateRepair(id: string, data: Partial<NewRepairInput>) {
  await updateDoc(doc(db, REPAIRS, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteRepair(id: string) {
  await deleteDoc(doc(db, REPAIRS, id))
}

export async function listRepairs(assignee?: string) {
  // Avoid composite index by ordering on a single field (expectedDate).
  // We group by status on the client.
  let q = query(collection(db, REPAIRS), orderBy('expectedDate'))
  if (assignee) {
    q = query(collection(db, REPAIRS), where('assignedTo', '==', assignee), orderBy('expectedDate'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Repair[]
}



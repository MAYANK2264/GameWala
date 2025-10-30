import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where, getDocs as getDocsRaw } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Product } from '../types/product'
import { auth } from '../firebaseConfig'

const PRODUCTS = 'products'

export async function fetchProducts(): Promise<Product[]> {
  const q = query(collection(db, PRODUCTS), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[]
}

type NewProductInput = Omit<Product, 'id' | 'createdBy' | 'updatedAt'>

export async function addProduct(data: NewProductInput): Promise<string> {
  const createdBy = auth.currentUser?.email ?? 'unknown'
  const ref = await addDoc(collection(db, PRODUCTS), {
    ...data,
    createdBy,
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProduct(id: string, data: Partial<NewProductInput>) {
  await updateDoc(doc(db, PRODUCTS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, PRODUCTS, id))
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const q = query(collection(db, PRODUCTS), where('barcode', '==', barcode))
  const snap = await getDocsRaw(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...(d.data() as any) } as Product
}

export async function updateProductStatus(id: string, status: string) {
  await updateDoc(doc(db, PRODUCTS, id), { status, updatedAt: serverTimestamp() })
}

export async function fetchSoldProducts(): Promise<Product[]> {
  // Avoid composite index by removing orderBy here; we sort on the client.
  const q = query(collection(db, PRODUCTS), where('status', '==', 'sold'))
  const snap = await getDocs(q)
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[]
  return rows
}



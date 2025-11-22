import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Sale } from '../types/sale';

const SALES = 'sales';

export async function createSale(data: Omit<Sale, 'id'>) {
  const ref = await addDoc(collection(db, SALES), data);
  return ref.id;
}

export async function fetchSales(): Promise<Sale[]> {
  const snap = await getDocs(collection(db, SALES));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Sale[];
}

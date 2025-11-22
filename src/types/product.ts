import { Timestamp } from 'firebase/firestore'

export type Product = {
  id: string
  barcode: string
  type: string
  brand: string
  condition: string
  acquisitionPrice: number
  acquiredDate: string
  acquiredFrom: string
  customerPhone: string // New field: seller/customer phone
  notes?: string
  createdBy: string
  updatedAt: Timestamp
  status?: string
}



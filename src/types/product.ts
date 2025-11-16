import { Timestamp } from 'firebase/firestore'

export type Product = {
  id: string
  barcode: string
  type: string
  brand: string
  condition: string
  acquisitionPrice: number // Selling price
  buyingPrice?: number // Buying/cost price
  quantity?: number // Quantity of items
  acquiredDate: string
  acquiredFrom: string
  customerPhone: string // New field: seller/customer phone
  notes?: string
  photoUrls?: string[] // Array of photo URLs
  createdBy: string
  updatedAt: Timestamp
  status?: string
}



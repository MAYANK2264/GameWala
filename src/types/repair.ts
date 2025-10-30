export type RepairStatus = 'Received' | 'In Progress' | 'Repaired' | 'Delivered'

export type Repair = {
  id: string
  productId: string
  customerName: string
  customerPhone: string // New field: required phone
  receivedDate: string
  expectedDate: string
  faultDescription: string
  status: RepairStatus
  estimate: number
  actualCost?: number
  assignedTo: string
  productProcedure?: string
  notes?: string
  voiceNoteUrl?: string
}



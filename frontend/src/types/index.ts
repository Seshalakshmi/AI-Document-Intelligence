// TypeScript types mirroring the backend domain entities

export type Role = 'user' | 'admin'

export interface User {
  id: number
  email: string
  role: Role
  is_active: boolean
}

export type DocumentStatus = 'uploaded' | 'text_extracted' | 'chunked' | 'processed' | 'error'

export interface Document {
  id: number
  filename: string
  file_path?: string | null
  file_type: string
  file_size: number
  file_hash: string
  status: DocumentStatus
  raw_text?: string | null
  uploaded_by: number // user id
  created_at: string // ISO string
  processing_error?: string | null
}

export interface DocumentChunk {
  id: number
  document_id: number
  chunk_text: string
  chunk_index: number
}

export interface ExtractedInvoiceData {
  id: number
  document_id: number
  vendor?: string | null
  amount?: number | null
  date?: string | null
  invoice_number?: string | null
  line_items?: Array<{ description: string; qty: number; price: number }> | null
  confidence_score: number // 0-1
  raw_ai_response?: any
  needs_review: boolean
}

// Auth response shapes
export interface AuthTokens {
  access_token: string
  token_type: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

// TypeScript types mirroring the ACTUAL backend Pydantic schemas
// (checked against backend/app/schemas/*.py)

export type Role = 'user' | 'admin' | 'reviewer'

export interface User {
  id: number
  fullname: string
  email: string
  role: Role
  is_active: boolean
  is_admin: boolean
  created_at: string
}

// Real values the backend actually sets on Document.status
// (see backend/app/api/routes/documents.py, document_service.py, chunking_service.py, vectorization_service.py)
export type DocumentStatus = 'text_extracted' | 'failed' | 'chunked' | 'vectorized'

export interface Document {
  id: number
  original_filename: string
  stored_filename: string
  file_path: string
  file_type: string
  file_size: number | null
  status: DocumentStatus
  raw_text: string | null
  description: string | null
  created_at: string // ISO string
}

export interface DailyCount {
  date: string
  count: number
}

export interface DocumentStats {
  total: number
  vectorized: number
  processing: number
  failed: number
  daily_counts: DailyCount[]
}

// Response shape of POST /api/documents/upload/{user_id}
export interface UploadDocumentResponse {
  message: string
  document: Document
}

export interface DocumentChunk {
  id: number
  document_id: number
  chunk_index: number
  content: string
  start_char: number | null
  end_char: number | null
  token_count: number | null
  created_at: string
}

export interface ExtractedInvoiceData {
  id: number
  document_id: number
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null // ISO date
  currency: string | null
  subtotal: number | null
  tax_amount: number | null
  total_amount: number | null
  payment_terms: string | null
  confidence_score: number | null // 0-1
  raw_extraction_json: string | null
  is_reviewed: boolean
  reviewed_by_id: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

// Response shape of GET /api/search/keyword | /semantic | /hybrid
export interface SearchResult {
  document_id: number
  chunk_id: number
  chunk_index: number | null
  original_filename: string
  content: string
  similarity: number | null
  score: number | null
  match_type: string | null
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


export interface GlobalChatSource {
  document_id: number
  original_filename: string
  chunk_id: number
  chunk_index: number
  similarity: number
}

export interface GlobalChatAnswer {
  answer: string
  sources: GlobalChatSource[]
}

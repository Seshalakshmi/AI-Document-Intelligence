import {
  Document,
  DocumentChunk,
  ExtractedInvoiceData,
  LoginResponse,
  SearchResult,
  UploadDocumentResponse,
  User,
  DocumentStats,
  GlobalChatAnswer,
  DocumentComment,
} from '@/types'

// IMPORTANT: your backend mounts every route under /api
// (see backend/app/main.py: app.include_router(api_router, prefix="/api"))
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') + '/api'

function getAuthHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleJSONResponse(res: Response) {
  if (!res.ok) {
    // FastAPI error bodies are JSON: { detail: "..." }
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.detail ?? message
    } catch {
      // response wasn't JSON, fall back to statusText
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

// ---------- Auth ----------

export async function register(fullname: string, email: string, password: string) {
  // POST /api/users/register -> UserResponse
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullname, email, password, role: 'user' }),
  })
  await handleJSONResponse(res)
  // Registration doesn't return tokens -- log in immediately after
  return login(email, password)
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  // FastAPI OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
  const params = new URLSearchParams()
  params.set('username', email) // OAuth2PasswordRequestForm always calls it 'username'
  params.set('password', password)

  const tokenRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const tokenJson = (await handleJSONResponse(tokenRes)) as { access_token: string; token_type?: string }

  const user = await getCurrentUser(tokenJson.access_token)

  return {
    user,
    tokens: { access_token: tokenJson.access_token, token_type: tokenJson.token_type ?? 'bearer' },
  }
}

export async function getCurrentUser(token?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

// ---------- Documents ----------

export async function uploadDocument(
  file: File,
  userId: number,
  token?: string,
  onProgress?: (p: number) => void
): Promise<UploadDocumentResponse> {
  // POST /api/documents/upload/{user_id}  (multipart/form-data)
  const url = `${API_BASE}/documents/upload/${userId}`
  const form = new FormData()
  form.append('file', file)

  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total)
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          try {
            const body = JSON.parse(xhr.responseText)
            reject(new Error(body.detail || xhr.statusText || 'Upload failed'))
          } catch {
            reject(new Error(xhr.statusText || 'Upload failed'))
          }
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(form)
    })
  }

  const res = await fetch(url, { method: 'POST', body: form, headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function listDocuments(token?: string): Promise<Document[]> {
  // GET /api/documents/
  const res = await fetch(`${API_BASE}/documents/`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function getDocument(documentId: number, token?: string): Promise<Document> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function getDocumentChunks(documentId: number, token?: string): Promise<DocumentChunk[]> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/chunks`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

// ---------- Comments ----------
// Human comment thread on a document (separate from the AI chat further
// below). GET is public, POST requires auth -- matches the backend routes
// in backend/app/api/routes/comments.py.

export async function getDocumentComments(documentId: number, token?: string): Promise<DocumentComment[]> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/comments`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function postDocumentComment(documentId: number, content: string, token?: string): Promise<DocumentComment> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
    body: JSON.stringify({ content }),
  })
  return handleJSONResponse(res)
}

// Returns null instead of throwing when no invoice data exists yet (backend 404s in that case)
export async function getExtractedData(documentId: number, token?: string): Promise<ExtractedInvoiceData | null> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/invoice-data`, { headers: getAuthHeader(token) })
  if (res.status === 404) return null
  return handleJSONResponse(res)
}

export async function reviewInvoiceData(
  documentId: number,
  userId: number,
  updates: Partial<
    Pick<
      ExtractedInvoiceData,
      'supplier_name' | 'invoice_number' | 'currency' | 'payment_terms' | 'invoice_date' | 'subtotal' | 'tax_amount' | 'total_amount'
    >
  >,
  token?: string
): Promise<ExtractedInvoiceData> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/invoice-data/review/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
    body: JSON.stringify(updates),
  })
  return handleJSONResponse(res)
}

// ---------- Search ----------
// Backend has no single generic "search" endpoint -- keyword / semantic / hybrid are separate.

export async function searchKeyword(query: string, token?: string, limit = 10): Promise<SearchResult[]> {
  const qs = new URLSearchParams({ query, limit: String(limit) })
  const res = await fetch(`${API_BASE}/search/keyword?${qs}`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function searchSemantic(query: string, token?: string, limit = 10): Promise<SearchResult[]> {
  const qs = new URLSearchParams({ query, limit: String(limit) })
  const res = await fetch(`${API_BASE}/search/semantic?${qs}`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function searchHybrid(query: string, token?: string, limit = 10): Promise<SearchResult[]> {
  const qs = new URLSearchParams({ query, limit: String(limit) })
  const res = await fetch(`${API_BASE}/search/hybrid?${qs}`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function extractInvoiceData(documentId: number, token?: string) {
  const res = await fetch(`${API_BASE}/documents/${documentId}/extract-invoice`, {
    method: 'POST',
    headers: getAuthHeader(token),
  })
  return handleJSONResponse(res)
}

// ---------- Admin (no /admin prefix on the backend -- these are just admin-gated /users routes) ----------

export async function listUsers(token?: string): Promise<User[]> {
  // GET /api/users/  (requires admin -- enforced server-side via get_current_admin_user)
  const res = await fetch(`${API_BASE}/users/`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function updateUserRole(userId: number, role: string, token?: string): Promise<User> {
  // PUT /api/users/{id}  (backend only accepts PUT with a partial body, not PATCH)
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
    body: JSON.stringify({ role }),
  })
  return handleJSONResponse(res)
}

export async function setUserActive(userId: number, isActive: boolean, token?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
    body: JSON.stringify({ is_active: isActive }),
  })
  return handleJSONResponse(res)
}

// ---------- Chat ----------

export async function askDocumentQuestion(documentId: number, question: string, token?: string) {
  const res = await fetch(`${API_BASE}/documents/${documentId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
    body: JSON.stringify({ question }),
  })
  return handleJSONResponse(res) as Promise<{ answer: string; sources: Array<{ chunk_id: number; chunk_index: number; similarity: number }> }>
}

export function getDocumentDownloadUrl(documentId: number): string {
  return `${API_BASE}/documents/${documentId}/download`
}

export function getDocumentPreviewUrl(documentId: number): string {
  return `${API_BASE}/documents/${documentId}/preview`
}

export function getDocumentThumbnailUrl(documentId: number): string {
  return `${API_BASE}/documents/${documentId}/thumbnail`
}

export async function getDocumentStats(token?: string): Promise<DocumentStats> {
  // GET /api/documents/stats
  const res = await fetch(`${API_BASE}/documents/stats`, { headers: getAuthHeader(token) })
  return handleJSONResponse(res)
}

export async function vectorizeDocument(
  documentId: number,
  token?: string
): Promise<Document> {
  const res = await fetch(
    `${API_BASE}/documents/${documentId}/vectorize`,
    {
      method: 'POST',
      headers: getAuthHeader(token),
    }
  )

  return handleJSONResponse(res)
}


export async function askAllDocumentsQuestion(question: string, token?: string): Promise<GlobalChatAnswer> {
  // POST /api/chat -- searches across every vectorized document, not one
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader(token) },
    body: JSON.stringify({ question }),
  })
  return handleJSONResponse(res)
}

const api = {
  register,
  login,
  getCurrentUser,
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentChunks,
  getDocumentComments,
  postDocumentComment,
  getExtractedData,
  reviewInvoiceData,
  searchKeyword,
  searchSemantic,
  searchHybrid,
  listUsers,
  updateUserRole,
  setUserActive,
  askDocumentQuestion,
  getDocumentDownloadUrl,
  getDocumentPreviewUrl,
  getDocumentThumbnailUrl,
  getDocumentStats,
  vectorizeDocument,
  askAllDocumentsQuestion,
}

export default api

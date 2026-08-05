'use client'
import React, { use } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { Document, DocumentChunk, ExtractedInvoiceData } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import ChunkList from '@/components/ui/ChunkList'
import ConfidenceBadge from '@/components/ui/ConfidenceBadge'
import ChatPanel from '@/components/ui/ChatPanel'
import { useQuery } from '@tanstack/react-query'

// Next.js 16 passes `params` as a Promise, even in client components -- unwrap with React.use()
export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const documentId = Number(id)
  const { token } = useAuth()

  const { data: doc, isLoading, isError, error } = useQuery<Document, Error>({
    queryKey: ['document', documentId, token],
    queryFn: () => api.getDocument(documentId, token ?? undefined),
    enabled: !!token,
    refetchInterval: (query) => {
      // Poll while document is still processing; stop once vectorized or failed
      const data = query.state.data
      if (!data) return 3000
      return data.status === 'vectorized' || data.status === 'failed' ? false : 3000
    },
  })

  // A document's status only ever finishes at "vectorized" or "failed" --
  // once it's there, chunks/extracted data won't change anymore, so stop
  // polling. Same condition as the `doc` query above.
  const isSettled = doc?.status === 'vectorized' || doc?.status === 'failed'

  const { data: chunks } = useQuery<DocumentChunk[], Error>({
    queryKey: ['document', documentId, 'chunks', token],
    queryFn: () => api.getDocumentChunks(documentId, token ?? undefined),
    enabled: !!doc,
    refetchInterval: isSettled ? false : 5000,
  })

  const { data: extracted } = useQuery<ExtractedInvoiceData | null, Error>({
    queryKey: ['document', documentId, 'extracted', token],
    queryFn: () => api.getExtractedData(documentId, token ?? undefined),
    enabled: !!doc,
    refetchInterval: isSettled ? false : 5000,
  })

  if (isLoading) return <div className="container">Loading…</div>
  if (isError) return <div className="container text-red-600">{(error as Error)?.message}</div>
  if (!doc) return <div className="container">Document not found</div>

  return (
    <div className="container grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="border rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{doc.original_filename}</h3>
              <div className="text-xs text-slate-500">{doc.file_type} • {doc.file_size ?? '?'} bytes</div>
            </div>
            <StatusBadge status={doc.status} />
          </div>
          <details className="mt-4">
            <summary className="text-sm font-medium">Raw extracted text</summary>
            <pre className="mt-2 p-3 bg-slate-50 rounded max-h-48 overflow-y-auto text-sm">{doc.raw_text ?? 'No text extracted yet.'}</pre>
          </details>
          <div className="mt-4">
            <h4 className="text-sm font-medium">Chunks</h4>
            <ChunkList chunks={chunks ?? []} />
          </div>
        </div>

        <div className="mt-4 border rounded p-4">
          <h4 className="text-sm font-medium">AI Summary (placeholder)</h4>
          <div className="mt-2 text-sm text-slate-600">Summary will appear here when the backend provides a summary endpoint.</div>
        </div>

        <div className="mt-4">
          <ChatPanel documentId={documentId} />
        </div>
      </div>

      <aside className="p-4 border rounded">
        <h4 className="text-sm font-medium">Metadata</h4>
        <div className="mt-2 text-sm text-slate-600 space-y-1">
          <div>Uploaded at: {new Date(doc.created_at).toLocaleString()}</div>
          {doc.description && <div>Description: {doc.description}</div>}
        </div>

        <div className="mt-4">
          <h5 className="text-sm font-medium">Extracted Invoice Data</h5>
          {extracted ? (
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between"><div>Supplier</div><div>{extracted.supplier_name ?? '—'}</div></div>
              <div className="flex items-center justify-between"><div>Invoice #</div><div>{extracted.invoice_number ?? '—'}</div></div>
              <div className="flex items-center justify-between"><div>Invoice date</div><div>{extracted.invoice_date ?? '—'}</div></div>
              <div className="flex items-center justify-between"><div>Total</div><div>{extracted.total_amount != null ? `${extracted.total_amount} ${extracted.currency ?? ''}` : '—'}</div></div>
              <div className="flex items-center justify-between"><div>Reviewed</div><div>{extracted.is_reviewed ? 'Yes' : 'No'}</div></div>
              <div className="pt-2">
                <ConfidenceBadge value={extracted.confidence_score} />
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 mt-2">No extracted data available yet.</div>
          )}
        </div>
      </aside>
    </div>
  )
}

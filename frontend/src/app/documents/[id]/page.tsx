'use client'
import React from 'react'
import { useAuth } from '../../../hooks/useAuth'
import api from '../../../lib/api'
import { Document, DocumentChunk, ExtractedInvoiceData } from '../../../types'
import StatusBadge from '../../../components/ui/StatusBadge'
import ChunkList from '../../../components/ui/ChunkList'
import ConfidenceBadge from '../../../components/ui/ConfidenceBadge'
import ChatPanel from '../../../components/ui/ChatPanel'
import { useQuery } from '@tanstack/react-query'

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const documentId = Number(params.id)
  const { token } = useAuth()

  const { data: doc, isLoading, isError, error } = useQuery<Document, Error>(
    ['document', documentId, token],
    () => api.getDocument(documentId, token),
    {
      enabled: !!token,
      refetchInterval: (data) => {
        // Poll while document is in processing stages; stop once processed or error
        if (!data) return 3000
        return data.status === 'processed' || data.status === 'error' ? false : 3000
      }
    }
  )

  const { data: chunks } = useQuery<DocumentChunk[], Error>(
    ['document', documentId, 'chunks', token],
    () => api.getDocumentChunks(documentId, token),
    {
      enabled: !!doc,
      refetchInterval: 5000
    }
  )

  const { data: extracted } = useQuery<ExtractedInvoiceData | null, Error>(
    ['document', documentId, 'extracted', token],
    () => api.getExtractedData(documentId, token),
    {
      enabled: !!doc,
      refetchInterval: 5000
    }
  )

  if (isLoading) return <div className="container">Loading…</div>
  if (isError) return <div className="container text-red-600">{(error as Error)?.message}</div>
  if (!doc) return <div className="container">Document not found</div>

  return (
    <div className="container grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="border rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{doc.filename}</h3>
              <div className="text-xs text-slate-500">{doc.file_type} • {doc.file_size} bytes</div>
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
          <div>Hash: {doc.file_hash}</div>
          <div>Uploaded by: {doc.uploaded_by}</div>
          {doc.processing_error && <div className="text-red-600">Error: {doc.processing_error}</div>}
        </div>

        <div className="mt-4">
          <h5 className="text-sm font-medium">Extracted Invoice Data</h5>
          {extracted ? (
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between"><div>Vendor</div><div>{extracted.vendor}</div></div>
              <div className="flex items-center justify-between"><div>Amount</div><div>{extracted.amount}</div></div>
              <div className="flex items-center justify-between"><div>Date</div><div>{extracted.date}</div></div>
              <div className="flex items-center justify-between"><div>Needs review</div><div>{extracted.needs_review ? 'Yes' : 'No'}</div></div>
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

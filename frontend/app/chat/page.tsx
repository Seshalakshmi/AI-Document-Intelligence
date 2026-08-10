'use client'
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { Document } from '@/types'
import ChatPanel from '@/components/ui/ChatPanel'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'

export default function ChatEntryPage() {
  const { token } = useAuth()
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null)

  const { data: docs, isLoading } = useQuery<Document[], Error>({
    queryKey: ['documents', token],
    queryFn: () => api.listDocuments(token ?? undefined),
    enabled: !!token,
  })

  const chattable = docs?.filter((document) => document.status === 'vectorized') ?? []
  const selectedDocument = chattable.find((document) => document.id === selectedDocumentId) ?? null

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">Chat with your documents</h2>

      {isLoading && <div>Loading...</div>}

      {!isLoading && chattable.length === 0 && (
        <div className="text-sm text-slate-500">
          No documents are ready to chat with yet. Upload a document and wait for it to finish vectorizing.
        </div>
      )}

      {chattable.length > 0 && (
        <div className="grid grid-cols-12 gap-6">
          <main className="col-span-7">
            <ChatPanel onSourceSelect={setSelectedDocumentId} />
          </main>

          <aside className="col-span-5">
            <DocumentPreview document={selectedDocument} />
          </aside>
        </div>
      )}
    </div>
  )
}

function DocumentPreview({ document }: { document: Document | null }) {
  if (!document) {
    return (
      <div className="rounded border p-4 text-sm text-slate-500">
        Ask a question, then click a highlighted source document to preview it here.
      </div>
    )
  }

  const documentUrl = api.getDocumentDownloadUrl(document.id)
  const previewUrl = api.getDocumentPreviewUrl(document.id)
  const canPreview = ['.pdf', '.png', '.jpg', '.jpeg', '.txt'].includes(document.file_type)

  return (
    <div className="rounded border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{document.original_filename}</h3>
          <div className="text-xs text-slate-500">{document.file_type}</div>
        </div>
        <a
          href={documentUrl}
          download={document.original_filename}
          className="inline-flex shrink-0 items-center gap-2 rounded border px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <Download size={14} />
          Download
        </a>
      </div>

      {canPreview ? (
        <iframe
          src={previewUrl}
          title={`${document.original_filename} preview`}
          className="h-[720px] w-full rounded border bg-slate-50"
        />
      ) : (
      <div className="flex aspect-[3/4] items-center justify-center rounded border bg-slate-50">
        <div className="text-center">
          <FileText size={48} className="mx-auto text-slate-300" />
          <div className="mt-2 text-xs text-slate-500">Preview is not available for this file type.</div>
        </div>
      </div>
      )}
    </div>
  )
}

'use client'
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { Document } from '@/types'
import ChatPanel from '@/components/ui/ChatPanel'
import { useQuery } from '@tanstack/react-query'

export default function ChatEntryPage() {
  const { token } = useAuth()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: docs, isLoading } = useQuery<Document[], Error>({
    queryKey: ['documents', token],
    queryFn: () => api.listDocuments(token ?? undefined),
    enabled: !!token,
  })

  // Chat is per-document (backend retrieves context scoped to one
  // document's embeddings), so only documents that are actually
  // vectorized show up as chattable.
  const chattable = docs?.filter((d) => d.status === 'vectorized') ?? []

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">Chat with your documents</h2>

      {isLoading && <div>Loading…</div>}

      {!isLoading && chattable.length === 0 && (
        <div className="text-sm text-slate-500">
          No documents are ready to chat with yet. Upload a document and wait for it to finish vectorizing.
        </div>
      )}

      {chattable.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-2">Select a document</label>
            <select
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="" disabled>
                Choose a document…
              </option>
              {chattable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename}
                </option>
              ))}
            </select>
            {selectedId && (
              <p className="mt-3 text-xs text-slate-500">
                {chattable.find((d) => d.id === selectedId)?.description}
              </p>
            )}
          </div>

          <div className="col-span-2">
            {selectedId ? (
              <ChatPanel documentId={selectedId} />
            ) : (
              <div className="border rounded-md p-4 text-sm text-slate-500">
                Pick a document on the left to start chatting.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

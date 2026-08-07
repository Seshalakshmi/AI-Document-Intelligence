'use client'
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { Document } from '@/types'
import ChatPanel from '@/components/ui/ChatPanel'
import { useQuery } from '@tanstack/react-query'

const ALL_DOCS = 'all'

export default function ChatEntryPage() {
  const { token } = useAuth()
  const [selected, setSelected] = useState<string>(ALL_DOCS)

  const { data: docs, isLoading } = useQuery<Document[], Error>({
    queryKey: ['documents', token],
    queryFn: () => api.listDocuments(token ?? undefined),
    enabled: !!token,
  })

  // Per-document chat needs a specific document's embeddings, so only
  // vectorized documents are selectable when narrowing scope. Global chat
  // (the default) searches across all of them regardless of this list.
  const chattable = docs?.filter((d) => d.status === 'vectorized') ?? []
  const selectedId = selected === ALL_DOCS ? undefined : Number(selected)

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
            <label className="block text-sm font-medium mb-2">Scope</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value={ALL_DOCS}>All documents</option>
              {chattable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs text-slate-500">
              {selected === ALL_DOCS
                ? 'Ask about anything across your whole document library -- e.g. "what did Sarah Bern purchase for Paris in 2026?"'
                : chattable.find((d) => d.id === selectedId)?.description}
            </p>
          </div>

          <div className="col-span-2">
            <ChatPanel documentId={selectedId} />
          </div>
        </div>
      )}
    </div>
  )
}

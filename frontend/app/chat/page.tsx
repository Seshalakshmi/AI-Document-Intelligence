'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, MessageSquare } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { Document } from '@/types'
import ChatPanel from '@/components/ui/ChatPanel'

export default function ChatEntryPage() {
  const { token } = useAuth()

  const [selectedDocumentId, setSelectedDocumentId] =
    useState<number | null>(null)

  const { data: docs, isLoading } = useQuery<Document[], Error>({
    queryKey: ['documents', token],
    queryFn: () => api.listDocuments(token ?? undefined),
    enabled: !!token,
  })

  const chattable =
    docs?.filter((document) => document.status === 'vectorized') ?? []

  const selectedDocument =
    chattable.find((document) => document.id === selectedDocumentId) ?? null

  return (
    <div className="container flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-6 overflow-hidden md:h-[calc(100dvh-8rem)]">
      <div className="page-header shrink-0">
        <div>
          <div className="page-kicker">Ask</div>

          <h1 className="page-title">
            Chat with your documents
          </h1>

          <p className="page-subtitle">
            Ask questions across vectorized documents and inspect the exact
            source file beside the answer.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
          {chattable.length} ready
        </div>
      </div>

      {isLoading && (
        <div className="panel panel-pad text-sm text-slate-500">
          Loading documents...
        </div>
      )}

      {!isLoading && chattable.length === 0 && (
        <div className="panel panel-pad text-center">
          <MessageSquare
            size={28}
            className="mx-auto text-slate-300"
          />

          <div className="mt-3 text-sm font-semibold text-slate-950">
            No documents are ready yet
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Upload a document and wait for it to finish vectorizing.
          </p>
        </div>
      )}

      {chattable.length > 0 && (
        <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-h-0 min-w-0">
            <ChatPanel
              onSourceSelect={setSelectedDocumentId}
            />
          </div>

          <div className="min-h-0 min-w-0">
            <DocumentPreview
              document={selectedDocument}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentPreview({
  document,
}: {
  document: Document | null
}) {
  if (!document) {
    return (
      <aside className="panel panel-pad flex min-h-[460px] items-center justify-center text-center">
        <div>
          <FileText
            size={34}
            className="mx-auto text-slate-300"
          />

          <div className="mt-3 text-sm font-semibold text-slate-950">
            Source preview
          </div>

          <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
            Ask a question, then choose a source document to preview it here.
          </p>
        </div>
      </aside>
    )
  }

  const documentUrl =
    api.getDocumentDownloadUrl(document.id)

  const previewUrl =
    api.getDocumentPreviewUrl(document.id)

  const normalizedFileType =
    document.file_type?.toLowerCase() ?? ''

  const canPreview = [
    '.pdf',
    '.png',
    '.jpg',
    '.jpeg',
    '.txt',
  ].includes(normalizedFileType)

  return (
    <aside className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">
            {document.original_filename}
          </h3>

          <div className="mt-1 text-xs text-slate-500">
            {normalizedFileType
              .replace('.', '')
              .toUpperCase()}
          </div>
        </div>

        <a
          href={documentUrl}
          download={document.original_filename}
          className="btn btn-secondary shrink-0"
        >
          <Download size={15} />
          Download
        </a>
      </div>

      {canPreview ? (
        <iframe
          src={previewUrl}
          title={`${document.original_filename} preview`}
          className="h-[640px] w-full bg-slate-50"
        />
      ) : (
        <div className="flex aspect-[3/4] items-center justify-center bg-slate-50">
          <div className="text-center">
            <FileText
              size={48}
              className="mx-auto text-slate-300"
            />

            <div className="mt-2 text-xs text-slate-500">
              Preview is not available for this file type.
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

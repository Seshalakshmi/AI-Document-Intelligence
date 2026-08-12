'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Document } from '@/types'
import StatusBadge from './StatusBadge'
import { CalendarDays, ChevronDown, ChevronUp, ExternalLink, FileText } from 'lucide-react'

export const DocumentTile: React.FC<{ doc: Document; documentDate?: string | null; matchSnippet?: string }> = ({
  doc,
  documentDate,
  matchSnippet,
}) => {
  const [expanded, setExpanded] = useState(false)
  const displayDate = documentDate ?? doc.created_at

  return (
    <article className="panel overflow-hidden transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-950">{doc.original_filename}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays size={13} />
                {new Date(displayDate).toLocaleDateString()}
                <span className="text-slate-300">/</span>
                {doc.file_type.replace('.', '').toUpperCase()}
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp size={17} className="text-slate-400" /> : <ChevronDown size={17} className="text-slate-400" />}
        </button>

        <div className="shrink-0">
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4">
          <p className="text-sm leading-6 text-slate-600">
            {doc.description ?? 'No summary available yet. This document may still be processing.'}
          </p>
          {matchSnippet && (
            <p className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
              Matched: &quot;{matchSnippet.slice(0, 180)}...&quot;
            </p>
          )}
          <Link href={`/documents/${doc.id}`} className="btn btn-primary mt-4">
            View document
            <ExternalLink size={14} />
          </Link>
        </div>
      )}
    </article>
  )
}

export default DocumentTile

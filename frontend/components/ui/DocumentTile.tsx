'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Document } from '@/types'
import StatusBadge from './StatusBadge'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

export const DocumentTile: React.FC<{ doc: Document; documentDate?: string | null; matchSnippet?: string }> = ({
  doc,
  documentDate,
  matchSnippet,
}) => {
  const [expanded, setExpanded] = useState(false)
  const displayDate = documentDate ?? doc.created_at

  return (
    <div className="border rounded-md hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={18} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{doc.original_filename}</div>
              <div className="text-xs text-slate-500">Document date: {new Date(displayDate).toLocaleDateString()}</div>
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={doc.status} />
          
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3">
          <p className="text-sm text-slate-600">
            {doc.description ?? 'No summary available yet -- this document may not be vectorized.'}
          </p>
          {matchSnippet && (
            <p className="mt-2 text-xs text-slate-400 italic">Matched: &quot;{matchSnippet.slice(0, 140)}...&quot;</p>
          )}
          <Link
            href={`/documents/${doc.id}`}
            className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-black"
          >
            View document
          </Link>
        </div>
      )}
    </div>
  )
}

export default DocumentTile

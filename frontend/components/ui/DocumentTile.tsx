'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Document } from '@/types'
import StatusBadge from './StatusBadge'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

export const DocumentTile: React.FC<{ doc: Document; matchSnippet?: string }> = ({ doc, matchSnippet }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-md hover:shadow-sm transition-shadow">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={18} className="text-slate-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{doc.original_filename}</div>
            <div className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={doc.status} />
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3">
          <p className="text-sm text-slate-600">
            {doc.description ?? 'No summary available yet -- this document may not be vectorized.'}
          </p>
          {matchSnippet && (
            <p className="mt-2 text-xs text-slate-400 italic">Matched: "{matchSnippet.slice(0, 140)}..."</p>
          )}
          <Link
            href={`/documents/${doc.id}`}
            className="inline-block mt-3 px-3 py-1.5 text-xs font-medium bg-accent text-white rounded"
          >
            View Details
          </Link>
        </div>
      )}
    </div>
  )
}

export default DocumentTile

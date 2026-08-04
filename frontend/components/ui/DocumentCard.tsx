import React from 'react'
import Link from 'next/link'
import { Document } from '@/types'
import StatusBadge from './StatusBadge'

export const DocumentCard: React.FC<{ doc: Document }> = ({ doc }) => {
  return (
    <Link href={`/documents/${doc.id}`} className="block border rounded-md p-4 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium">{doc.original_filename}</div>
          <div className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleString()}</div>
        </div>
        <div className="ml-4">
          <StatusBadge status={doc.status} />
        </div>
      </div>
    </Link>
  )
}

export default DocumentCard

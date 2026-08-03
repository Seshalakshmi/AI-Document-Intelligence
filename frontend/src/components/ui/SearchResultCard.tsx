import React from 'react'
import Link from 'next/link'
import { Document } from '../../types'

export const SearchResultCard: React.FC<{ doc: Document; snippet?: string }> = ({ doc, snippet }) => {
  return (
    <Link href={`/documents/${doc.id}`} className="block border rounded-md p-4 hover:shadow-sm">
      <div className="text-sm font-medium">{doc.filename}</div>
      <div className="text-xs text-slate-500">{snippet ?? doc.raw_text?.slice(0, 180) ?? ''}</div>
    </Link>
  )
}

export default SearchResultCard

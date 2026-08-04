import React from 'react'
import Link from 'next/link'
import { SearchResult } from '@/types'

export const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const score = result.similarity ?? result.score
  return (
    <Link href={`/documents/${result.document_id}`} className="block border rounded-md p-4 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{result.original_filename}</div>
        {score != null && <div className="text-xs text-slate-400">{Math.round(score * 100)}% match</div>}
      </div>
      <div className="text-xs text-slate-500 mt-1">{result.content.slice(0, 180)}</div>
    </Link>
  )
}

export default SearchResultCard

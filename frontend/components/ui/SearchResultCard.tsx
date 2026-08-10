import React from 'react'
import Link from 'next/link'
import { SearchResult } from '@/types'
import { CalendarDays, FileText, Hash, ReceiptText } from 'lucide-react'

export const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const score = result.similarity ?? result.score
  const total = formatMoney(result.total_amount, result.currency)

  return (
    <article className="block border rounded-md p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText size={16} className="shrink-0 text-slate-400" />
            <span className="truncate">{result.original_filename}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {result.invoice_date && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={13} />
                {new Date(result.invoice_date).toLocaleDateString()}
              </span>
            )}
            {result.invoice_number && (
              <span className="inline-flex items-center gap-1">
                <Hash size={13} />
                {result.invoice_number}
              </span>
            )}
            {total && (
              <span className="inline-flex items-center gap-1">
                <ReceiptText size={13} />
                {total}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Link
            href={`/documents/${result.document_id}`}
            className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-black"
          >
            View document
          </Link>
          {score != null && <div className="text-xs font-medium text-slate-500">{Math.round(score * 100)}% match</div>}
          {result.confidence_score != null && (
            <div className="text-xs text-slate-400">{Math.round(result.confidence_score * 100)}% confidence</div>
          )}
        </div>
      </div>

      {result.supplier_name && (
        <div className="mt-3 text-sm font-medium text-slate-700">{result.supplier_name}</div>
      )}
      <div className="mt-2 text-xs leading-5 text-slate-500">{result.content.slice(0, 220)}</div>
    </article>
  )
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return null
  return `${currency ?? ''} ${amount.toLocaleString()}`.trim()
}

export default SearchResultCard

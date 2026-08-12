import React from 'react'
import Link from 'next/link'
import { SearchResult } from '@/types'
import { CalendarDays, ExternalLink, FileText, Hash, ReceiptText } from 'lucide-react'

export const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const score = result.similarity ?? result.score
  const total = formatMoney(result.total_amount, result.currency)

  return (
    <article className="panel panel-pad transition hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-950">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <FileText size={17} />
            </span>
            <span className="truncate">{result.original_filename}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            {result.invoice_date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} />
                {new Date(result.invoice_date).toLocaleDateString()}
              </span>
            )}
            {result.invoice_number && (
              <span className="inline-flex items-center gap-1.5">
                <Hash size={13} />
                {result.invoice_number}
              </span>
            )}
            {total && (
              <span className="inline-flex items-center gap-1.5">
                <ReceiptText size={13} />
                {total}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <Link href={`/documents/${result.document_id}`} className="btn btn-primary">
            View
            <ExternalLink size={14} />
          </Link>
          {score != null && <div className="text-xs font-semibold text-blue-700">{Math.round(score * 100)}% match</div>}
          {result.confidence_score != null && (
            <div className="text-xs text-slate-400">{Math.round(result.confidence_score * 100)}% confidence</div>
          )}
        </div>
      </div>

      {result.supplier_name && <div className="mt-4 text-sm font-semibold text-slate-800">{result.supplier_name}</div>}
      <div className="mt-2 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">{result.content.slice(0, 260)}</div>
    </article>
  )
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return null
  return `${currency ?? ''} ${amount.toLocaleString()}`.trim()
}

export default SearchResultCard

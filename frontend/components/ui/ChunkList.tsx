import React, { useState } from 'react'
import { DocumentChunk, InvoiceStructuredData } from '@/types'
import { FileText, Receipt } from 'lucide-react'

type Party = {
  name?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
} | null | undefined

export const ChunkList: React.FC<{ chunks: DocumentChunk[] }> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) {
    return (
      <div className="rounded border border-dashed bg-slate-50 p-4 text-sm text-slate-500">
        No extracted document sections are available yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {chunks.map((chunk, index) => (
        <ChunkCard key={chunk.id} chunk={chunk} index={index} />
      ))}
    </div>
  )
}

function ChunkCard({ chunk, index }: { chunk: DocumentChunk; index: number }) {
  const [showRaw, setShowRaw] = useState(false)
  // The backend only ever attaches structured_data to an invoice chunk, so
  // trust that flag instead of re-deriving structure from raw text.
  const isInvoice = chunk.document_type === 'invoice' && !!chunk.structured_data

  return (
    <article className="overflow-hidden rounded border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {isInvoice ? (
            <Receipt size={16} className="shrink-0 text-slate-400" />
          ) : (
            <FileText size={16} className="shrink-0 text-slate-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-medium text-slate-800">Extracted Section {index + 1}</h5>
              {isInvoice && (
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                  Invoice
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{getSectionMeta(chunk)}</p>
          </div>
        </div>

        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer select-none hover:text-slate-700">Details</summary>
          <div className="mt-2 w-64 space-y-1 rounded border bg-white p-2 sm:w-80">
            <div>Chunk index: {chunk.chunk_index}</div>
            {chunk.start_char != null && chunk.end_char != null && (
              <div>
                Character range: {chunk.start_char}-{chunk.end_char}
              </div>
            )}
            {chunk.created_at && <div>Created: {new Date(chunk.created_at).toLocaleString()}</div>}
            {isInvoice && (
              <button
                type="button"
                onClick={() => setShowRaw((prev) => !prev)}
                className="mt-1 font-medium text-indigo-600 hover:underline"
              >
                {showRaw ? 'Hide raw extracted text' : 'View raw extracted text'}
              </button>
            )}
          </div>
        </details>
      </div>

      <div className="px-4 py-4">
        {isInvoice && chunk.structured_data ? (
          <>
            <InvoiceContent data={chunk.structured_data} />
            {showRaw && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <SectionTitle>Raw Extracted Text</SectionTitle>
                <ReadableContent content={chunk.content} />
              </div>
            )}
          </>
        ) : (
          <ReadableContent content={chunk.content} />
        )}
      </div>
    </article>
  )
}

function InvoiceContent({ data }: { data: InvoiceStructuredData }) {
  console.log(data)
  const items = data.items ?? []
  const totals = data.totals ?? {}
  const hasMeta = Boolean(data.date || data.ship_mode || data.balance_due)
  const hasTotals = Boolean(totals.subtotal || totals.discount || totals.shipping || totals.total)
  const hasFooter = Boolean(data.notes || data.terms || data.order_id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Invoice</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{data.company || 'Invoice'}</div>
        </div>

        {data.invoice_number && (
          <div className="sm:text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Invoice Number</div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-800">#{data.invoice_number}</div>
          </div>
        )}
      </div>

      {(hasParty(data.bill_to) || hasParty(data.ship_to)) && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <PartyBlock label="Bill To" party={data.bill_to} />
          <PartyBlock label="Ship To" party={data.ship_to} />
        </div>
      )}

      {hasMeta && (
        <div className="grid grid-cols-1 gap-5 border-y border-slate-200 py-4 sm:grid-cols-3">
          <MetaBlock label="Date" value={data.date ?? undefined} />
          <MetaBlock label="Ship Mode" value={data.ship_mode ?? undefined} />
          <MetaBlock label="Balance Due" value={data.balance_due ?? undefined} emphasize />
        </div>
      )}

      {items.length > 0 && (
        <div>
          <SectionTitle>Items</SectionTitle>
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Item</th>
                  <th className="w-24 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                  <th className="w-32 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rate</th>
                  <th className="w-32 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={`${item.name ?? 'item'}-${index}`} className="hover:bg-slate-50">
                    <td className="px-3 py-3 text-sm text-slate-700">{item.name || 'Unnamed item'}</td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-slate-600">{formatValue(item.quantity)}</td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-slate-600">{formatValue(item.rate)}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium tabular-nums text-slate-800">{formatValue(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasTotals && (
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <SectionTitle>Summary</SectionTitle>
            <div className="space-y-2">
              <SummaryRow label="Subtotal" value={totals.subtotal ?? undefined} />
              <SummaryRow label="Discount" value={totals.discount ?? undefined} />
              <SummaryRow label="Shipping" value={totals.shipping ?? undefined} />
              {totals.total && (
                <>
                  <div className="my-3 border-t border-slate-200" />
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-900">Total</span>
                    <span className="text-lg font-bold tabular-nums text-slate-900">{totals.total}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {hasFooter && (
        <div className="border-t border-slate-200 pt-5">
          <SectionTitle>Additional Information</SectionTitle>
          <div className="space-y-4">
            <InfoBlock label="Notes">{data.notes}</InfoBlock>
            <InfoBlock label="Terms">{data.terms}</InfoBlock>
            <InfoBlock label="Order ID">
              {data.order_id && <span className="font-mono text-xs">{data.order_id}</span>}
            </InfoBlock>
          </div>
        </div>
      )}
    </div>
  )
}

function hasParty(party: Party) {
  return Boolean(party && (party.name || party.city || party.state || party.country))
}

function PartyBlock({ label, party }: { label: string; party: Party }) {
  if (!hasParty(party)) return null
  const location = [party?.city, party?.state, party?.country].filter(Boolean).join(', ')

  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm leading-6 text-slate-700">
        {party?.name && <div className="font-medium text-slate-900">{party.name}</div>}
        {location && <div>{location}</div>}
      </div>
    </div>
  )
}

function formatValue(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-'
  return typeof value === 'number' ? value.toLocaleString() : value
}

function ReadableContent({ content }: { content: string }) {
  // Group by blank lines so ordinary prose reads as paragraphs instead of
  // one bordered row per line, which was choppy for anything that wasn't a
  // strict label/value layout.
  const paragraphs = content
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return <div className="text-sm text-slate-500">This section has no readable text.</div>
  }

  return (
    <div className="space-y-3 rounded border bg-slate-50 p-4">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line text-sm leading-6 text-slate-700">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function InfoBlock({ label, children }: { label: string; children?: React.ReactNode }) {
  if (!children) return null

  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm leading-6 text-slate-700">{children}</div>
    </div>
  )
}

function MetaBlock({ label, value, emphasize = false }: { label: string; value?: string; emphasize?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={emphasize ? 'mt-1 text-sm font-semibold tabular-nums text-slate-900' : 'mt-1 text-sm font-medium text-slate-700'}>
        {value || '-'}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums text-slate-700">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</div>
}

function getSectionMeta(chunk: DocumentChunk) {
  const parts: string[] = []

  if (chunk.token_count != null) {
    parts.push(`${chunk.token_count} tokens`)
  }

  if (chunk.start_char != null && chunk.end_char != null) {
    parts.push(`${chunk.end_char - chunk.start_char} characters`)
  }

  return parts.length > 0 ? parts.join(' | ') : 'Extracted text'
}

export default ChunkList

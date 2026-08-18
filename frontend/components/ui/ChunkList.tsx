import React, { useState } from 'react'
import { DocumentChunk, InvoiceStructuredData } from '@/types'

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
      {chunks.map((chunk) => (
        <ChunkCard key={chunk.id} chunk={chunk} />
      ))}
    </div>
  )
}

function ChunkCard({ chunk }: { chunk: DocumentChunk }) {
  const [showRaw, setShowRaw] = useState(false)
  // The backend only ever attaches structured_data to an invoice chunk, so
  // trust that flag instead of re-deriving structure from raw text.
  const isInvoice = chunk.document_type === 'invoice' && !!chunk.structured_data

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-semibold text-slate-800">Chunk #{chunk.chunk_index}</h5>
          {isInvoice && (
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
              Invoice
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{getSectionMeta(chunk)}</span>
          <details className="relative">
            <summary className="cursor-pointer select-none list-none font-medium text-slate-500 hover:text-slate-700">
              Details
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-64 space-y-1 rounded-md border border-slate-200 bg-white p-3 text-left shadow-lg sm:w-80">
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
      </div>

      <div className="px-5 py-5">
        {isInvoice && chunk.structured_data ? (
          <>
            <InvoiceContent data={chunk.structured_data} />
            {showRaw && (
              <div className="mt-5 border-t border-slate-100 pt-4">
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
  const items = data.items ?? []
  const totals = data.totals ?? {}
  const hasParties = hasParty(data.bill_to) || hasParty(data.ship_to)
  const hasDateRow = Boolean(data.date)
  const hasShipRow = Boolean(data.ship_mode || data.balance_due)
  const hasTotals = Boolean(totals.subtotal || totals.discount || totals.shipping || totals.total)
  const hasFooter = Boolean(data.notes || data.terms || data.order_id)

  return (
    <div className="space-y-5">
      {/* INVOICE  ................................  #8367 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Invoice</div>
          <div className="mt-1 text-lg font-bold text-slate-900">{data.company || 'Invoice'}</div>
        </div>
        {data.invoice_number && (
          <div className="font-mono text-sm font-semibold text-slate-500">#{data.invoice_number}</div>
        )}
      </div>

      {/* BILL TO / SHIP TO boxes */}
      {hasParties && (
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <PartyBox label="Bill To" party={data.bill_to} />
          <PartyBox label="Ship To" party={data.ship_to} />
        </div>
      )}

      {/* Date / Ship Mode / Balance Due */}
      {(hasDateRow || hasShipRow) && (
        <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
          {hasDateRow && (
            <div className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Date
              </span>
              <span className="text-slate-700">{data.date}</span>
            </div>
          )}
          {hasShipRow && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              {data.ship_mode && (
                <div className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Ship Mode
                  </span>
                  <span className="text-slate-700">{data.ship_mode}</span>
                </div>
              )}
              {data.balance_due && (
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Balance Due
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900">{data.balance_due}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Items */}
      {items.length > 0 && (
        <div className="border-t border-slate-100 pt-5">
          <SectionTitle>Items</SectionTitle>
          <div className="overflow-x-auto">
            <div className="min-w-[440px]">
              <div className="flex gap-3 border-b border-slate-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="flex-1">Item</span>
                <span className="w-14 text-right">Qty</span>
                <span className="w-24 text-right">Rate</span>
                <span className="w-28 text-right">Amount</span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <div key={`${item.name ?? 'item'}-${index}`} className="flex gap-3 py-2.5 text-sm">
                    <span className="flex-1 truncate text-slate-700">{item.name || 'Unnamed item'}</span>
                    <span className="w-14 text-right tabular-nums text-slate-600">{formatValue(item.quantity)}</span>
                    <span className="w-24 text-right tabular-nums text-slate-600">{formatValue(item.rate)}</span>
                    <span className="w-28 text-right font-medium tabular-nums text-slate-800">
                      {formatValue(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {hasTotals && (
        <div className="border-t border-slate-100 pt-5">
          <SectionTitle>Summary</SectionTitle>
          <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={totals.subtotal ?? undefined} />
            <SummaryRow label="Discount" value={totals.discount ?? undefined} negative />
            <SummaryRow label="Shipping" value={totals.shipping ?? undefined} />
            {totals.total && (
              <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-sm font-semibold text-slate-900">Total</span>
                <span className="text-base font-bold tabular-nums text-slate-900">{totals.total}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes / Terms / Order ID */}
      {hasFooter && (
        <div className="border-t border-slate-100 pt-5">
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

function PartyBox({ label, party }: { label: string; party: Party }) {
  if (!hasParty(party)) return null
  const location = [party?.city, party?.state, party?.country].filter(Boolean).join(', ')

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
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

function SummaryRow({ label, value, negative = false }: { label: string; value?: string; negative?: boolean }) {
  if (!value) return null
  const display = negative && !value.trim().startsWith('-') ? `-${value}` : value

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums text-slate-700">{display}</span>
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
    parts.push(`Characters ${chunk.start_char}-${chunk.end_char}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Extracted text'
}

export default ChunkList

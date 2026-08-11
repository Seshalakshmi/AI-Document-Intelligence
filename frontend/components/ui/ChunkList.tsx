import React from 'react'
import { DocumentChunk } from '@/types'
import { FileText } from 'lucide-react'

type InvoiceItem = {
  name: string
  quantity?: string
  rate?: string
  amount?: string
}

type ParsedInvoice = {
  invoiceNumber?: string
  company?: string
  billTo?: string
  shipTo?: string[]
  date?: string
  shipMode?: string
  balanceDue?: string
  items: InvoiceItem[]
  unstructuredItems: string[]
  subtotal?: string
  discount?: string
  shipping?: string
  total?: string
  notes?: string
  terms?: string
  orderId?: string
}

const FIELD_LABELS = new Set([
  'invoice',
  'bill to',
  'ship to',
  'date',
  'ship mode',
  'balance due',
  'item',
  'quantity',
  'rate',
  'amount',
  'subtotal',
  'shipping',
  'total',
  'notes',
  'terms',
])

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
        <article key={chunk.id} className="overflow-hidden rounded border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={16} className="shrink-0 text-slate-400" />
              <div>
                <h5 className="text-sm font-medium text-slate-800">Extracted Section {index + 1}</h5>
                <p className="text-xs text-slate-500">{getSectionMeta(chunk)}</p>
              </div>
            </div>

            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer select-none hover:text-slate-700">Details</summary>
              <div className="mt-2 space-y-1 rounded border bg-white p-2">
                <div>Chunk index: {chunk.chunk_index}</div>
                {chunk.start_char != null && chunk.end_char != null && (
                  <div>
                    Character range: {chunk.start_char}-{chunk.end_char}
                  </div>
                )}
                {chunk.created_at && <div>Created: {new Date(chunk.created_at).toLocaleString()}</div>}
              </div>
            </details>
          </div>

          <div className="px-4 py-4">
            <InvoiceContent content={chunk.content} />
          </div>
        </article>
      ))}
    </div>
  )
}

function InvoiceContent({ content }: { content: string }) {
  const invoice = parseInvoice(content)

  if (!invoice) {
    return <ReadableContent content={content} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Invoice</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{invoice.company || 'Invoice'}</div>
        </div>

        {invoice.invoiceNumber && (
          <div className="sm:text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Invoice Number</div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-800">#{invoice.invoiceNumber}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <InfoBlock label="Bill To">{invoice.billTo}</InfoBlock>
        <InfoBlock label="Ship To">
          {invoice.shipTo?.map((line, index) => (
            <div key={`${line}-${index}`} className={index === 0 ? 'font-medium text-slate-900' : undefined}>
              {line}
            </div>
          ))}
        </InfoBlock>
      </div>

      <div className="grid grid-cols-1 gap-5 border-y border-slate-200 py-4 sm:grid-cols-3">
        <MetaBlock label="Date" value={invoice.date} />
        <MetaBlock label="Ship Mode" value={invoice.shipMode} />
        <MetaBlock label="Balance Due" value={invoice.balanceDue} emphasize />
      </div>

      {(invoice.items.length > 0 || invoice.unstructuredItems.length > 0) && (
        <div>
          <SectionTitle>Items</SectionTitle>

          {invoice.items.length > 0 ? (
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
                  {invoice.items.map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-sm text-slate-700">{item.name}</td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-slate-600">{item.quantity || '-'}</td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-slate-600">{item.rate || '-'}</td>
                      <td className="px-3 py-3 text-right text-sm font-medium tabular-nums text-slate-800">{item.amount || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded border bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {invoice.unstructuredItems.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {(invoice.subtotal || invoice.discount || invoice.shipping || invoice.total) && (
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <SectionTitle>Summary</SectionTitle>
            <div className="space-y-2">
              <SummaryRow label="Subtotal" value={invoice.subtotal} />
              <SummaryRow label="Discount" value={invoice.discount} />
              <SummaryRow label="Shipping" value={invoice.shipping} />
              {invoice.total && (
                <>
                  <div className="my-3 border-t border-slate-200" />
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-900">Total</span>
                    <span className="text-lg font-bold tabular-nums text-slate-900">{invoice.total}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {(invoice.notes || invoice.terms || invoice.orderId) && (
        <div className="border-t border-slate-200 pt-5">
          <SectionTitle>Additional Information</SectionTitle>
          <div className="space-y-4">
            <InfoBlock label="Notes">{invoice.notes}</InfoBlock>
            <InfoBlock label="Terms">{invoice.terms}</InfoBlock>
            <InfoBlock label="Order ID">
              {invoice.orderId && <span className="font-mono text-xs">{invoice.orderId}</span>}
            </InfoBlock>
          </div>
        </div>
      )}
    </div>
  )
}

function parseInvoice(content: string): ParsedInvoice | null {
  const lines = getLines(content)
  const looksLikeInvoice = lines.some((line) => normalize(line) === 'invoice')

  if (!looksLikeInvoice) return null

  const invoice: ParsedInvoice = {
    items: [],
    unstructuredItems: [],
  }

  const invoiceNumberLineIndex = lines.findIndex((line) => /^#\s*[\w-]+/.test(line))
  if (invoiceNumberLineIndex !== -1) {
    invoice.invoiceNumber = lines[invoiceNumberLineIndex].replace(/^#\s*/, '').trim()
    const possibleCompany = lines[invoiceNumberLineIndex + 1]
    if (possibleCompany && !isReservedLabel(possibleCompany)) invoice.company = possibleCompany
  }

  invoice.billTo = getValueAfterLabel(lines, 'Bill To')
  invoice.shipTo = getAddressBlock(lines, 'Ship To', ['Date', 'Ship Mode', 'Balance Due', 'Item'])
  invoice.date = getValueAfterLabel(lines, 'Date')
  invoice.shipMode = getValueAfterLabel(lines, 'Ship Mode')
  invoice.balanceDue = getMoneyAfterLabel(lines, 'Balance Due')
  invoice.subtotal = getMoneyAfterLabel(lines, 'Subtotal')
  invoice.discount = getMoneyAfterPartialLabel(lines, 'discount')
  invoice.shipping = getMoneyAfterLabel(lines, 'Shipping')
  invoice.total = getMoneyAfterLabel(lines, 'Total')
  invoice.notes = getTextAfterLabel(lines, 'Notes')
  invoice.terms = getTextAfterLabel(lines, 'Terms')

  const orderIdLine = lines.find((line) => normalize(line).startsWith('order id'))
  if (orderIdLine) invoice.orderId = orderIdLine.replace(/^order id\s*:?\s*/i, '').trim()

  const itemLines = getItemLines(lines)
  invoice.items = parseItems(itemLines)
  invoice.unstructuredItems = invoice.items.length > 0 ? [] : itemLines

  const hasUsefulData = Boolean(
    invoice.invoiceNumber ||
      invoice.company ||
      invoice.billTo ||
      invoice.date ||
      invoice.items.length > 0 ||
      invoice.total
  )

  return hasUsefulData ? invoice : null
}

function getLines(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line !== ':')
}

function getValueAfterLabel(lines: string[], label: string) {
  const index = findLabelIndex(lines, label)
  if (index === -1) return undefined

  const value = lines[index + 1]
  if (!value || isReservedLabel(value)) return undefined

  return value
}

function getTextAfterLabel(lines: string[], label: string) {
  const value = getValueAfterLabel(lines, label)
  if (!value || isMoney(value)) return undefined
  return value
}

function getMoneyAfterLabel(lines: string[], label: string) {
  const value = getValueAfterLabel(lines, label)
  return value && isMoney(value) ? value : undefined
}

function getMoneyAfterPartialLabel(lines: string[], labelStart: string) {
  const index = lines.findIndex((line) => normalize(line).startsWith(labelStart))
  if (index === -1) return undefined

  const value = lines[index + 1]
  return value && !isReservedLabel(value) && isMoney(value) ? value : undefined
}

function getAddressBlock(lines: string[], label: string, stopLabels: string[]) {
  const index = findLabelIndex(lines, label)
  if (index === -1) return undefined

  const stopSet = new Set(stopLabels.map(normalize))
  const block: string[] = []

  for (let i = index + 1; i < lines.length; i++) {
    if (stopSet.has(normalize(lines[i]))) break
    if (!isReservedLabel(lines[i])) block.push(lines[i])
  }

  return block.length > 0 ? block.slice(0, 4) : undefined
}

function getItemLines(lines: string[]) {
  const itemIndex = findLabelIndex(lines, 'Item')
  if (itemIndex === -1) return []

  const endIndex = firstIndexAfter(lines, itemIndex, ['Subtotal', 'Shipping', 'Total', 'Notes', 'Terms'])
  return lines
    .slice(itemIndex + 1, endIndex === -1 ? lines.length : endIndex)
    .filter((line) => !['quantity', 'rate', 'amount'].includes(normalize(line)))
}

function parseItems(itemLines: string[]) {
  const items: InvoiceItem[] = []
  let index = 0

  while (index < itemLines.length) {
    const name = itemLines[index]
    const quantity = itemLines[index + 1]
    const rate = itemLines[index + 2]
    const amount = itemLines[index + 3]

    if (
      name &&
      !isReservedLabel(name) &&
      !isMoney(name) &&
      isQuantity(quantity) &&
      isMoney(rate) &&
      isMoney(amount)
    ) {
      items.push({ name, quantity, rate, amount })
      index += 4
    } else {
      index += 1
    }
  }

  return items
}

function firstIndexAfter(lines: string[], startIndex: number, labels: string[]) {
  const normalizedLabels = new Set(labels.map(normalize))
  return lines.findIndex((line, index) => index > startIndex && normalizedLabels.has(normalize(line)))
}

function findLabelIndex(lines: string[], label: string) {
  return lines.findIndex((line) => normalize(line) === normalize(label))
}

function normalize(value: string) {
  return value.trim().replace(/:$/, '').toLowerCase()
}

function isReservedLabel(value: string) {
  const normalized = normalize(value)
  return FIELD_LABELS.has(normalized) || normalized.startsWith('discount')
}

function isMoney(value?: string) {
  return Boolean(value && /^-?\$?[\d,]+(?:\.\d{2})?$/.test(value.trim()) && /[$.]/.test(value))
}

function isQuantity(value?: string) {
  return Boolean(value && /^\d+(?:\.\d+)?$/.test(value.trim()))
}

function ReadableContent({ content }: { content: string }) {
  const lines = getLines(content)

  if (lines.length === 0) {
    return <div className="text-sm text-slate-500">This section has no readable text.</div>
  }

  return (
    <div className="rounded border bg-slate-50">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`} className="border-b px-3 py-2 text-sm leading-6 text-slate-700 last:border-b-0">
          {line}
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

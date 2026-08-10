'use client'
import React, { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import DocumentTile from '@/components/ui/DocumentTile'
import SearchResultCard from '@/components/ui/SearchResultCard'
import { Document, ExtractedInvoiceData, SearchResult } from '@/types'
import { useQueries, useQuery } from '@tanstack/react-query'

type SearchMode = 'keyword' | 'semantic' | 'hybrid'

export default function SearchPage() {
  const { token } = useAuth()
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<SearchMode>('keyword')
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  // Filters
  const [year, setYear] = useState<string>('')
  const [fileType, setFileType] = useState<string>('') // closest proxy to "category" -- see note below
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  

  // Default: load every document. This is what renders as tiles until the
  // user actually searches.
  const { data: allDocs, isLoading } = useQuery<Document[], Error>({
    queryKey: ['documents', token],
    queryFn: () => api.listDocuments(token ?? undefined),
    enabled: !!token,
  })

  const invoiceDataQueries = useQueries({
    queries: (allDocs ?? []).map((doc) => ({
      queryKey: ['document', doc.id, 'extracted', token],
      queryFn: () => api.getExtractedData(doc.id, token ?? undefined),
      enabled: !!token,
      staleTime: 60_000,
    })),
  })

  const invoiceDataByDocumentId = useMemo(() => {
    const map = new Map<number, ExtractedInvoiceData>()
    ;(allDocs ?? []).forEach((doc, index) => {
      const invoiceData = invoiceDataQueries[index]?.data
      if (invoiceData) map.set(doc.id, invoiceData)
    })
    return map
  }, [allDocs, invoiceDataQueries])

  const years = useMemo(() => {
    const dates = searchResults
      ? searchResults.map((result) => getSearchResultDate(result, allDocs))
      : (allDocs ?? []).map((document) => getDocumentDate(document, invoiceDataByDocumentId))
    const validDates = dates.filter((date): date is string => Boolean(date))
    const set = new Set(validDates.map((date) => new Date(date).getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [allDocs, invoiceDataByDocumentId, searchResults])

  const fileTypes = useMemo(() => {
    const set = new Set((allDocs ?? []).map((d) => d.file_type.replace('.', '')))
    return Array.from(set)
  }, [allDocs])

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (q.trim().length < 2) {
      setSearchResults(null) // fall back to default listing
      return
    }
    setSearching(true)
    try {
      const fn = mode === 'semantic' ? api.searchSemantic : mode === 'hybrid' ? api.searchHybrid : api.searchKeyword
      const res = await fn(q, token ?? undefined)
      setSearchResults(res)
    } catch (err: unknown) {
      alert(getErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setQ('')
    setSearchResults(null)
  }

  // Build the tile list: either the default full listing, or search hits
  // mapped back to their parent Document (search results are chunk-level,
  // tiles are document-level) -- de-duplicated, preserving relevance order.
  const tileSource: Array<{ doc: Document; snippet?: string }> = useMemo(() => {
    if (searchResults) {
      const seen = new Set<number>()
      const out: Array<{ doc: Document; snippet?: string }> = []
      for (const r of searchResults) {
        if (seen.has(r.document_id)) continue
        const doc = allDocs?.find((d) => d.id === r.document_id)
        if (!doc) continue
        seen.add(r.document_id)
        out.push({ doc, snippet: r.content })
      }
      return out
    }
    return (allDocs ?? []).map((doc) => ({ doc }))
  }, [searchResults, allDocs])

  const filtered = tileSource.filter(({ doc }) => {
    const documentDate = getDocumentDate(doc, invoiceDataByDocumentId)
    if (year && new Date(documentDate).getFullYear() !== Number(year)) return false
    if (fileType && doc.file_type.replace('.', '') !== fileType) return false
    if (dateFrom && new Date(documentDate) < new Date(dateFrom)) return false
    if (dateTo && new Date(documentDate) > new Date(dateTo)) return false
    return true
  })

  const filteredSearchResults = (searchResults ?? []).filter((result) => {
    const doc = allDocs?.find((d) => d.id === result.document_id)
    const documentDate = getSearchResultDate(result, allDocs)
    if (year && (!documentDate || new Date(documentDate).getFullYear() !== Number(year))) return false
    if (fileType && doc?.file_type.replace('.', '') !== fileType) return false
    if (dateFrom && (!documentDate || new Date(documentDate) < new Date(dateFrom))) return false
    if (dateTo && (!documentDate || new Date(documentDate) > new Date(dateTo))) return false
    return true
  })

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">Search Documents</h2>

      <form onSubmit={doSearch} className="flex gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search document content (min 2 chars) — leave empty to browse all"
          className="flex-1 border rounded px-3 py-2"
        />
        <select value={mode} onChange={(e) => setMode(e.target.value as SearchMode)} className="border rounded px-2 py-2">
          <option value="keyword">Keyword</option>
          <option value="semantic">Semantic</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <button className="px-4 py-2 bg-accent text-white rounded" disabled={searching}>
          {searching ? '...' : 'Search'}
        </button>
        {searchResults && (
          <button type="button" onClick={clearSearch} className="px-3 py-2 border rounded text-sm">
            Clear
          </button>
        )}
      </form>

      {/* Filters -- always available, apply on top of either the default
          listing or active search results */}
      <div className="flex flex-wrap gap-3 mb-6 text-sm">
        <select value={year} onChange={(e) => setYear(e.target.value)} className="border rounded px-2 py-1.5">
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* NOTE: your schema doesn't have a true "category" field yet, so
            this filters by file type (pdf/docx/image) as the closest
            available proxy. If you want real categories (e.g. Invoice,
            Contract, Receipt), that needs a new field populated during
            extraction -- happy to add that as a follow-up. */}
        <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="border rounded px-2 py-1.5">
          <option value="">All file types</option>
          {fileTypes.map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <span className="text-slate-500">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-2 py-1.5" />
        </div>

        {(year || fileType || dateFrom || dateTo) && (
          <button
            onClick={() => { setYear(''); setFileType(''); setDateFrom(''); setDateTo('') }}
            className="text-slate-500 underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Tiles */}
      {isLoading && <div>Loading…</div>}
      {!isLoading && (searchResults ? filteredSearchResults.length === 0 : filtered.length === 0) && (
        <div className="text-sm text-slate-500">No documents match.</div>
      )}
      <div className="space-y-2">
        {searchResults
          ? filteredSearchResults.map((result) => (
              <SearchResultCard key={`${result.document_id}-${result.chunk_id}`} result={result} />
            ))
          : filtered.map(({ doc, snippet }) => (
              <DocumentTile
                key={doc.id}
                doc={doc}
                documentDate={getDocumentDate(doc, invoiceDataByDocumentId)}
                matchSnippet={snippet}
              />
            ))}
      </div>
    </div>
  )
}

function getSearchResultDate(result: SearchResult, docs?: Document[]) {
  return result.invoice_date ?? docs?.find((doc) => doc.id === result.document_id)?.created_at ?? null
}

function getDocumentDate(document: Document, invoiceDataByDocumentId: Map<number, ExtractedInvoiceData>) {
  return invoiceDataByDocumentId.get(document.id)?.invoice_date ?? document.created_at
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

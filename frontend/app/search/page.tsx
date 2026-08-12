'use client'
import React, { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import DocumentTile from '@/components/ui/DocumentTile'
import SearchResultCard from '@/components/ui/SearchResultCard'
import { Document, ExtractedInvoiceData, SearchResult } from '@/types'
import { useQueries, useQuery } from '@tanstack/react-query'
import { FilterX, Search } from 'lucide-react'

type SearchMode = 'keyword' | 'semantic' | 'hybrid'

export default function SearchPage() {
  const { token } = useAuth()
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<SearchMode>('keyword')
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [year, setYear] = useState<string>('')
  const [fileType, setFileType] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

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
      setSearchResults(null)
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

  const resultCount = searchResults ? filteredSearchResults.length : filtered.length
  const hasFilters = Boolean(year || fileType || dateFrom || dateTo)

  return (
    <div className="container page-stack">
      <div className="page-header">
        <div>
          <div className="page-kicker">Discovery</div>
          <h1 className="page-title">Search documents</h1>
          <p className="page-subtitle">
            Browse your document library or search inside extracted text with keyword, semantic, or hybrid matching.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </div>
      </div>

      <div className="panel panel-pad space-y-4">
        <form onSubmit={doSearch} className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search document content, supplier names, invoice numbers..."
              className="input pl-10"
            />
          </div>
          <div className="flex rounded-md border border-slate-300 bg-white p-1 shadow-sm">
            {(['keyword', 'semantic', 'hybrid'] as SearchMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition ${
                  mode === item ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
          {searchResults && (
            <button type="button" onClick={clearSearch} className="btn btn-secondary">
              Clear
            </button>
          )}
        </form>

        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="select">
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="select">
            <option value="">All file types</option>
            {fileTypes.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" aria-label="From date" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" aria-label="To date" />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setYear('')
                setFileType('')
                setDateFrom('')
                setDateTo('')
              }}
              className="btn btn-secondary"
            >
              <FilterX size={16} />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="panel panel-pad text-sm text-slate-500">Loading documents...</div>}
      {!isLoading && resultCount === 0 && (
        <div className="panel panel-pad text-center">
          <div className="text-sm font-semibold text-slate-950">No documents match</div>
          <p className="mt-1 text-sm text-slate-500">Try a broader query or clear the active filters.</p>
        </div>
      )}
      <div className="space-y-3">
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

'use client'
import React, { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import DocumentTile from '@/components/ui/DocumentTile'
import { Document, SearchResult } from '@/types'
import { useQuery } from '@tanstack/react-query'

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

  const years = useMemo(() => {
    const set = new Set((allDocs ?? []).map((d) => new Date(d.created_at).getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [allDocs])

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
    } catch (err: any) {
      alert(err.message)
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
    if (year && new Date(doc.created_at).getFullYear() !== Number(year)) return false
    if (fileType && doc.file_type.replace('.', '') !== fileType) return false
    if (dateFrom && new Date(doc.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(doc.created_at) > new Date(dateTo)) return false
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
      {!isLoading && filtered.length === 0 && <div className="text-sm text-slate-500">No documents match.</div>}
      <div className="space-y-2">
        {filtered.map(({ doc, snippet }) => (
          <DocumentTile key={doc.id} doc={doc} matchSnippet={snippet} />
        ))}
      </div>
    </div>
  )
}

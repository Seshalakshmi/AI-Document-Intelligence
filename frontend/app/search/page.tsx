'use client'
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import SearchResultCard from '@/components/ui/SearchResultCard'
import { SearchResult } from '@/types'

type SearchMode = 'keyword' | 'semantic' | 'hybrid'

export default function SearchPage() {
  const { token } = useAuth()
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<SearchMode>('keyword')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (q.trim().length < 2) return // backend requires min_length=2
    setLoading(true)
    try {
      const fn = mode === 'semantic' ? api.searchSemantic : mode === 'hybrid' ? api.searchHybrid : api.searchKeyword
      const res = await fn(q, token ?? undefined)
      setResults(res)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">Search Documents</h2>
      <form onSubmit={doSearch} className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search text or filename (min 2 chars)"
          className="flex-1 border rounded px-3 py-2"
        />
        <select value={mode} onChange={(e) => setMode(e.target.value as SearchMode)} className="border rounded px-2 py-2">
          <option value="keyword">Keyword</option>
          <option value="semantic">Semantic</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <button className="px-4 py-2 bg-accent text-white rounded" disabled={loading}>{loading ? '...' : 'Search'}</button>
      </form>
      <div className="space-y-3">
        {results?.length === 0 && <div className="text-sm text-slate-500">No results.</div>}
        {results?.map((r) => (
          <SearchResultCard key={`${r.document_id}-${r.chunk_id}`} result={r} />
        ))}
      </div>
    </div>
  )
}

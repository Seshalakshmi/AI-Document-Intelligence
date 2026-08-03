'use client'
import React, { useState } from 'react'
import api from '../../lib/api'
import SearchResultCard from '../../components/ui/SearchResultCard'
import { Document } from '../../types'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Document[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      const res = await api.searchDocuments(q)
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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text or filename" className="flex-1 border rounded px-3 py-2" />
        <button className="px-4 py-2 bg-accent text-white rounded" disabled={loading}>{loading ? '...' : 'Search'}</button>
      </form>
      <div className="space-y-3">
        {results?.map((r) => (
          <SearchResultCard key={r.id} doc={r} snippet={r.raw_text?.slice(0, 200)} />
        ))}
      </div>
    </div>
  )
}

'use client'
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { DocumentStats } from '@/types'
import KpiCard from '@/components/ui/KpiCard'
import DocumentsOverTimeChart from '@/components/ui/DocumentsOverTimeChart'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, FileStack, CheckCircle2, Loader2, AlertTriangle, Search } from 'lucide-react'

export default function DashboardPage() {
  const { token } = useAuth()

  // Dashboard intentionally never fetches the full document list --
  // that's the search page's job. This is a lightweight aggregate query.
  const { data: stats, isLoading, isError, error } = useQuery<DocumentStats, Error>({
    queryKey: ['document-stats', token],
    queryFn: () => api.getDocumentStats(token ?? undefined),
    enabled: !!token,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      return data.processing > 0 ? 5000 : false
    },
    refetchOnWindowFocus: true,
  })

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">Overview</h2>

      {isLoading && <div>Loading…</div>}
      {isError && <div className="text-red-600">{(error as Error)?.message}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Documents" value={stats.total} color="teal" icon={FileStack} />
            <KpiCard label="Ready to Chat" value={stats.vectorized} color="cyan" icon={CheckCircle2} />
            <KpiCard label="Processing" value={stats.processing} color="amber" icon={Loader2} />
            <KpiCard label="Failed" value={stats.failed} color="orange" icon={AlertTriangle} />
          </div>

          <div className="mb-6">
            <DocumentsOverTimeChart dailyCounts={stats.daily_counts} />
          </div>
        </>
      )}

      <div className="mt-4 border-t pt-6 flex justify-center gap-4">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-5 py-3 border rounded-md font-medium hover:bg-slate-50"
        >
          <Search size={18} />
          Browse documents
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-md font-medium"
        >
          <MessageSquare size={18} />
          Chat with your documents
        </Link>
      </div>
    </div>
  )
}

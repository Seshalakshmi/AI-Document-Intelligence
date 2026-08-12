'use client'
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api'
import { DocumentStats } from '@/types'
import KpiCard from '@/components/ui/KpiCard'
import DocumentsOverTimeChart from '@/components/ui/DocumentsOverTimeChart'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, FileStack, Loader2, MessageSquare, Search, UploadCloud } from 'lucide-react'

export default function DashboardPage() {
  const { token } = useAuth()

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
    <div className="container page-stack">
      <div className="page-header">
        <div>
          <div className="page-kicker">Workspace Overview</div>
          <h1 className="page-title">Document intelligence dashboard</h1>
          <p className="page-subtitle">
            Track processing health, review extraction confidence, and jump into search or chat workflows.
          </p>
        </div>
        <Link href="/upload" className="btn btn-primary">
          <UploadCloud size={17} />
          Upload document
        </Link>
      </div>

      {isLoading && <StatePanel>Loading dashboard...</StatePanel>}
      {isError && <StatePanel tone="danger">{(error as Error)?.message}</StatePanel>}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="Total documents" value={stats.total} color="blue" icon={FileStack} />
            <KpiCard label="Ready to chat" value={stats.vectorized} color="green" icon={CheckCircle2} />
            <KpiCard label="Processing" value={stats.processing} color="amber" icon={Loader2} />
            <KpiCard label="Failed" value={stats.failed} color="red" icon={AlertTriangle} />
            <KpiCard
              label="Avg confidence"
              value={stats.average_confidence == null ? '-' : `${Math.round(stats.average_confidence * 100)}%`}
              color="violet"
              icon={CheckCircle2}
            />
          </div>

          <DocumentsOverTimeChart dailyCounts={stats.daily_counts} />
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/search" className="panel panel-pad group flex items-center justify-between gap-4 transition hover:border-blue-200 hover:bg-blue-50/30">
          <div>
            <div className="text-sm font-semibold text-slate-950">Browse and search documents</div>
            <div className="mt-1 text-sm text-slate-500">Filter by date, file type, or search across extracted content.</div>
          </div>
          <Search size={20} className="shrink-0 text-blue-600 transition group-hover:scale-105" />
        </Link>
        <Link href="/chat" className="panel panel-pad group flex items-center justify-between gap-4 transition hover:border-blue-200 hover:bg-blue-50/30">
          <div>
            <div className="text-sm font-semibold text-slate-950">Chat with your knowledge base</div>
            <div className="mt-1 text-sm text-slate-500">Ask questions and trace answers back to source documents.</div>
          </div>
          <MessageSquare size={20} className="shrink-0 text-blue-600 transition group-hover:scale-105" />
        </Link>
      </div>
    </div>
  )
}

function StatePanel({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'danger' }) {
  return (
    <div className={`panel panel-pad text-sm ${tone === 'danger' ? 'text-red-700' : 'text-slate-500'}`}>
      {children}
    </div>
  )
}

'use client'
import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'
import { Document } from '../../types'
import DocumentCard from '../../components/ui/DocumentCard'
import { useQuery } from '@tanstack/react-query'

export default function DashboardPage() {
  const { token } = useAuth()

  const { data: docs, isLoading, isError, error } = useQuery<Document[], Error>(
    ['documents', token],
    () => api.listDocuments(token),
    {
      enabled: !!token,
      refetchInterval: 5000, // poll every 5s to reflect processing status changes
      refetchOnWindowFocus: true
    }
  )

  return (
    <div className="container">
      <h2 className="text-lg font-semibold mb-4">Documents</h2>
      {isLoading && <div>Loading…</div>}
      {isError && <div className="text-red-600">{(error as Error)?.message}</div>}
      {docs && docs.length === 0 && <div className="text-sm text-slate-500">No documents uploaded yet.</div>}
      <div className="grid grid-cols-3 gap-4">
        {docs?.map((d) => (
          <DocumentCard key={d.id} doc={d} />
        ))}
      </div>
    </div>
  )
}

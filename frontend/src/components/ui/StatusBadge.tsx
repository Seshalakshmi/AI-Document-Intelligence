import React from 'react'

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    uploaded: 'bg-yellow-100 text-yellow-800',
    text_extracted: 'bg-blue-100 text-blue-800',
    chunked: 'bg-indigo-100 text-indigo-800',
    processed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  }
  const cls = map[status] ?? 'bg-slate-100 text-slate-800'
  return (
    <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded ${cls}`} aria-label={`status ${status}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default StatusBadge

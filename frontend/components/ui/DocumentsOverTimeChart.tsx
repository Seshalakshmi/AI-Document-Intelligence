'use client'
import React, { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DailyCount } from '@/types'

export const DocumentsOverTimeChart: React.FC<{ dailyCounts: DailyCount[] }> = ({ dailyCounts }) => {
  const data = useMemo(
    () =>
      dailyCounts.map((d) => ({
        day: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: d.count,
      })),
    [dailyCounts]
  )

  if (data.length === 0) {
    return (
      <div className="panel flex h-72 items-center justify-center p-4 text-sm text-slate-400">
        No documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="panel panel-pad">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">Documents processed over time</h4>
          <p className="mt-1 text-xs text-slate-500">Daily ingestion volume from uploaded documents.</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Bar dataKey="count" name="Documents" fill="#2563eb" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DocumentsOverTimeChart

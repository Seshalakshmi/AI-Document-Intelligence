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
      <div className="border rounded-lg p-4 bg-white h-72 flex items-center justify-center text-sm text-slate-400">
        No documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h4 className="text-sm font-medium text-teal-800 mb-3">Documents Processed Over Time</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Bar dataKey="count" name="Documents" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DocumentsOverTimeChart
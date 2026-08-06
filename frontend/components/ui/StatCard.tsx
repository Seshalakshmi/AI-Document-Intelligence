import React from 'react'

export const StatCard: React.FC<{ label: string; value: string | number; hint?: string }> = ({ label, value, hint }) => (
  <div className="border rounded-md p-4">
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-sm text-slate-500 mt-1">{label}</div>
    {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
  </div>
)

export default StatCard

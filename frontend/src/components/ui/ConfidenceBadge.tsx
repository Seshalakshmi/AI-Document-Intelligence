import React from 'react'

export const ConfidenceBadge: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100)
  const bg = value >= 0.8 ? 'bg-green-100 text-green-800' : value >= 0.7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded ${bg}`} title={`${pct}% confidence`}>
      <div className="w-20 bg-white/60 rounded h-2 overflow-hidden">
        <div style={{ width: `${pct}%` }} className="h-2 bg-current" />
      </div>
      <span className="min-w-[36px]">{pct}%</span>
    </div>
  )
}

export default ConfidenceBadge

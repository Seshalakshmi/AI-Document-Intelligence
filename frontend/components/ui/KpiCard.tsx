import React from 'react'
import { LucideIcon } from 'lucide-react'

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-rose-50 text-rose-700 ring-rose-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
} as const

export type KpiColor = keyof typeof COLOR_MAP

export const KpiCard: React.FC<{
  label: string
  value: string | number
  color: KpiColor
  icon?: LucideIcon
}> = ({ label, value, color, icon: Icon }) => {
  return (
    <div className="panel panel-pad">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-md ring-1 ${COLOR_MAP[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">{value}</div>
    </div>
  )
}

export default KpiCard

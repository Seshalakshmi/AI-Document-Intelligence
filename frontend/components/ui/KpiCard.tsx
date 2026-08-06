import React from 'react'
import { LucideIcon } from 'lucide-react'

const COLOR_MAP = {
  teal: 'bg-teal-800',
  cyan: 'bg-teal-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
} as const

export type KpiColor = keyof typeof COLOR_MAP

export const KpiCard: React.FC<{
  label: string
  value: string | number
  color: KpiColor
  icon?: LucideIcon
}> = ({ label, value, color, icon: Icon }) => {
  return (
    <div className={`${COLOR_MAP[color]} rounded-lg p-5 text-white`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white/80">{label}</div>
        {Icon && <Icon size={18} className="text-white/60" />}
      </div>
      <div className="text-4xl font-semibold mt-2">{value}</div>
    </div>
  )
}

export default KpiCard

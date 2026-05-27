'use client'

type Props = {
  label: string
  value: string
  sub?: string
  valueClass?: string
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, sub, valueClass = 'text-white', icon }: Props) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      <div className={`text-xl font-bold tracking-tight leading-tight ${valueClass}`}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  )
}

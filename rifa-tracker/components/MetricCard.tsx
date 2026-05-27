'use client'

type Props = {
  label: string
  value: string
  sub?: string
  valueClass?: string
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, sub, valueClass = '', icon }: Props) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

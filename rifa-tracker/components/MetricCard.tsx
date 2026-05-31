'use client'

import Sparkline from './Sparkline'

type Props = {
  label: string
  value: string
  sub?: string
  valueClass?: string
  icon?: React.ReactNode
  spark?: number[]
  delta?: number
  neutral?: boolean
}

export default function MetricCard({ label, value, sub, valueClass, spark, delta, neutral }: Props) {
  const up = (delta ?? 0) >= 0
  const deltaColor = neutral ? '#9a96ad' : (up ? '#34d399' : '#f87171')
  const deltaBg    = neutral ? 'rgba(255,255,255,.06)' : (up ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)')

  return (
    <div className="card card-glow" style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {label}
        </span>
        {delta != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: deltaColor, background: deltaBg, padding: '2px 7px', borderRadius: 20 }}>
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke={deltaColor} strokeWidth="2" strokeLinecap="round">
              {up ? <path d="M5 8V2M2.5 4.5L5 2l2.5 2.5" /> : <path d="M5 2v6M2.5 5.5L5 8l2.5-2.5" />}
            </svg>
            {delta > 0 ? '+' : ''}{Math.round(delta)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div className={`mono ${valueClass ?? ''}`} style={{ fontWeight: 600, fontSize: 26, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--fg)' }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>
      )}

      {/* Sparkline */}
      {spark && spark.length > 1 && (
        <div style={{ marginTop: 'auto' }}>
          <Sparkline data={spark} color="#06b6d4" height={28} />
        </div>
      )}
    </div>
  )
}

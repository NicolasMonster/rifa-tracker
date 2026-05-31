'use client'

type Props = {
  data: number[]
  color?: string
  height?: number
}

export default function Sparkline({ data, color = '#06b6d4', height = 28 }: Props) {
  if (!data || data.length < 2) return <div style={{ height }} />

  const w = 120, h = height, pad = 3
  const iw = w - pad * 2, ih = h - pad * 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map((v, i): [number, number] => [
    pad + (i / (data.length - 1)) * iw,
    pad + ih - ((v - min) / range) * ih,
  ])

  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${(w - pad).toFixed(1)} ${h - pad} L${pad} ${h - pad} Z`
  const gid = `sg${Math.random().toString(36).slice(2, 7)}`
  const last = pts[pts.length - 1]

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />
    </svg>
  )
}

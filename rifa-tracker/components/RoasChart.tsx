'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { DailyEntry } from '@/lib/supabase'
import { computeMetrics } from '@/lib/metrics'

type Props = { entries: DailyEntry[] }

export default function RoasChart({ entries }: Props) {
  const data = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({
      date: e.date.slice(5),
      roas: parseFloat((computeMetrics(e).roas ?? 0).toFixed(2)),
    }))

  if (data.length === 0) return null

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
        Evolución ROAS
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9a96ad' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9a96ad' }} />
          <Tooltip
            contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#f6f5fa' }}
            itemStyle={{ color: '#1D9E75' }}
            formatter={(v: number) => [`${v}x`, 'ROAS']}
          />
          <ReferenceLine y={1} stroke="#fbbf24" strokeDasharray="4 4"
            label={{ value: 'break-even', fontSize: 9, fill: '#fbbf24', position: 'right' }} />
          <ReferenceLine y={2} stroke="#06b6d4" strokeDasharray="4 4"
            label={{ value: '2x objetivo', fontSize: 9, fill: '#06b6d4', position: 'right' }} />
          <Line type="monotone" dataKey="roas" stroke="#1D9E75" strokeWidth={2.4}
            dot={{ r: 3, fill: '#1D9E75', strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

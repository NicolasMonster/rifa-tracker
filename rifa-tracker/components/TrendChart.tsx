'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { DailyEntry } from '@/lib/supabase'
import { fmt } from '@/lib/metrics'

type Props = { entries: DailyEntry[] }

export default function TrendChart({ entries }: Props) {
  const data = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(e => ({
      date:      e.date.slice(5),
      Generado:  e.generated,
      Invertido: e.spend,
    }))

  if (data.length < 2) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
        Cargá al menos 2 días para ver la tendencia
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9a96ad', fontFamily: 'Manrope' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9a96ad' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#f6f5fa', fontWeight: 600 }}
          formatter={(v: number, name: string) => [fmt(v, 2), name]}
        />
        <Legend
          iconType="plainline"
          iconSize={14}
          wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }}
        />
        <Line type="monotone" dataKey="Generado"  stroke="#06b6d4" strokeWidth={2.4} dot={false} />
        <Line type="monotone" dataKey="Invertido" stroke="#1D9E75" strokeWidth={2.4} dot={false} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  )
}

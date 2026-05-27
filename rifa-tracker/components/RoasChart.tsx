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
    .map(e => {
      const m = computeMetrics(e)
      return {
        date: e.date.slice(5),
        roas: parseFloat((m.roas ?? 0).toFixed(2)),
      }
    })

  if (data.length === 0) return null

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-gray-200">Evolución ROAS</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{ background: '#2a2a2a', border: '1px solid #444', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#f5f5f5' }}
            itemStyle={{ color: '#1D9E75' }}
            formatter={(v: number) => [`${v}x`, 'ROAS']}
          />
          <ReferenceLine
            y={1} stroke="#fbbf24" strokeDasharray="4 4"
            label={{ value: 'break-even', fontSize: 9, fill: '#fbbf24', position: 'right' }}
          />
          <ReferenceLine
            y={2} stroke="#1D9E75" strokeDasharray="4 4"
            label={{ value: '2x objetivo', fontSize: 9, fill: '#1D9E75', position: 'right' }}
          />
          <Line
            type="monotone"
            dataKey="roas"
            stroke="#1D9E75"
            strokeWidth={2}
            dot={{ r: 3, fill: '#1D9E75', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#1D9E75' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

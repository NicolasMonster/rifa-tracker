'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
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
        date: e.date.slice(5), // MM-DD
        roas: parseFloat((m.roas ?? 0).toFixed(2)),
        net: parseFloat((m.net ?? 0).toFixed(2)),
      }
    })

  if (data.length === 0) return null

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-800">Evolución ROAS</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip
            formatter={(v: number) => [`${v}x`, 'ROAS']}
            contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb' }}
          />
          <ReferenceLine y={1} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: 'break-even', fontSize: 10, fill: '#fbbf24' }} />
          <ReferenceLine y={2} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'objetivo 2x', fontSize: 10, fill: '#10b981' }} />
          <Line
            type="monotone"
            dataKey="roas"
            stroke="#1D9E75"
            strokeWidth={2}
            dot={{ r: 3, fill: '#1D9E75' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

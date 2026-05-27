'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Calendar, DollarSign, Star, Activity } from 'lucide-react'
import type { DailyEntry } from '@/lib/supabase'
import {
  computePaymentsHistory,
  getMonthEntries,
  getWeekEntries,
  fmt,
  fmtNum,
} from '@/lib/metrics'

type Props = { entries: DailyEntry[] }

export default function PaymentsHistory({ entries }: Props) {
  const rows        = useMemo(() => computePaymentsHistory(entries), [entries])
  const currentMonth = useMemo(() => getMonthEntries(entries),    [entries])
  const currentWeek  = useMemo(() => getWeekEntries(entries, 0),  [entries])
  const prevWeek     = useMemo(() => getWeekEntries(entries, 1),  [entries])

  const currentWeekTotal = currentWeek.reduce((s, e) => s + e.generated, 0)
  const prevWeekTotal    = prevWeek.reduce((s, e) => s + e.generated, 0)
  const weekVariation    = prevWeekTotal > 0
    ? ((currentWeekTotal - prevWeekTotal) / prevWeekTotal) * 100
    : null

  const currentMonthTotal = currentMonth.reduce((s, e) => s + e.generated, 0)
  const bestDay = currentMonth.reduce<DailyEntry | null>(
    (best, e) => (e.generated > (best?.generated ?? 0) ? e : best),
    null,
  )
  const monthNetBalance = currentMonth.reduce((s, e) => s + (e.generated - e.spend), 0)

  // Gráfica: últimos 30 días
  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(e => ({ date: e.date.slice(5), generado: e.generated }))

  return (
    <div className="space-y-6">

      {/* ── Cards resumen ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Semana actual */}
        <div className="card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} /> Semana actual
          </div>
          <div className="text-xl font-bold text-white">{fmt(currentWeekTotal)}</div>
          {weekVariation !== null ? (
            <div className={`flex items-center gap-1 text-xs font-medium ${weekVariation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {weekVariation >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {weekVariation >= 0 ? '+' : ''}{fmtNum(weekVariation, 1)}% vs sem. ant.
            </div>
          ) : (
            <div className="text-xs text-gray-600">Sin semana anterior</div>
          )}
        </div>

        {/* Facturación mes */}
        <div className="card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <DollarSign size={12} /> Facturación del mes
          </div>
          <div className="text-xl font-bold text-white">{fmt(currentMonthTotal)}</div>
          <div className="text-xs text-gray-600">{currentMonth.length} días registrados</div>
        </div>

        {/* Mejor día */}
        <div className="card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Star size={12} /> Mejor día del mes
          </div>
          <div className="text-xl font-bold text-white">{bestDay ? fmt(bestDay.generated) : '—'}</div>
          <div className="text-xs text-gray-600">{bestDay?.date ?? 'Sin datos'}</div>
        </div>

        {/* Balance neto */}
        <div className="card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Activity size={12} /> Balance neto mensual
          </div>
          <div className={`text-xl font-bold ${monthNetBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt(monthNetBalance)}
          </div>
          <div className="text-xs text-gray-600">generado − gasto</div>
        </div>
      </div>

      {/* ── Gráfica ────────────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">
            Facturación diaria — últimos 30 días
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: '#2a2a2a', border: '1px solid #444', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#f5f5f5' }}
                itemStyle={{ color: '#1D9E75' }}
                formatter={(v: number) => [fmt(v, 2), 'Facturado']}
              />
              <Bar dataKey="generado" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Tabla histórica ────────────────────────────────────────────── */}
      {rows.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333]">
                {[
                  'Fecha',
                  'Facturación',
                  'Variación %',
                  'Acum. 7 días',
                  'Acum. mensual',
                  'Neto día',
                  'Neto acum. mes',
                ].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.date} className="border-b border-[#2b2b2b] hover:bg-[#2f2f2f] transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">{row.date}</td>

                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                    {fmt(row.generated)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.variationPct !== null ? (
                      <span className={`flex items-center gap-1 text-xs font-medium ${row.variationPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.variationPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {row.variationPct >= 0 ? '+' : ''}{fmtNum(row.variationPct, 1)}%
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {fmt(row.weeklyAccum)}
                  </td>

                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {fmt(row.monthlyAccum)}
                  </td>

                  <td className={`px-4 py-3 font-medium whitespace-nowrap ${row.netDay >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt(row.netDay)}
                  </td>

                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${row.netMonthlyAccum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt(row.netMonthlyAccum)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500 text-sm">
          No hay registros aún. Agregá el primero en "Nuevo registro".
        </div>
      )}
    </div>
  )
}

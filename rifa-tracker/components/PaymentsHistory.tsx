'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { DailyEntry } from '@/lib/supabase'
import { computePaymentsHistory, getMonthEntries, getWeekEntries, fmt, fmtNum } from '@/lib/metrics'

type Props = { entries: DailyEntry[] }

const Stat = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
      {label}
    </div>
    <div className="mono" style={{ fontWeight: 600, fontSize: 26, color: color || 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
  </div>
)

export default function PaymentsHistory({ entries }: Props) {
  const rows         = useMemo(() => computePaymentsHistory(entries), [entries])
  const currentMonth = useMemo(() => getMonthEntries(entries),   [entries])
  const currentWeek  = useMemo(() => getWeekEntries(entries, 0), [entries])
  const prevWeek     = useMemo(() => getWeekEntries(entries, 1), [entries])

  const currentWeekTotal  = currentWeek.reduce((s, e) => s + e.generated, 0)
  const prevWeekTotal     = prevWeek.reduce((s, e) => s + e.generated, 0)
  const weekVariation     = prevWeekTotal > 0 ? ((currentWeekTotal - prevWeekTotal) / prevWeekTotal) * 100 : null

  const currentMonthTotal = currentMonth.reduce((s, e) => s + e.generated, 0)
  const bestDay           = currentMonth.reduce<DailyEntry | null>((best, e) => e.generated > (best?.generated ?? 0) ? e : best, null)
  const monthNetBalance   = currentMonth.reduce((s, e) => s + (e.generated - e.spend), 0)

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(e => ({ date: e.date.slice(5), generado: e.generated }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Summary cards ── */}
      <div className="card" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '22px 24px' }}>
        <Stat label="Semana actual" value={fmt(currentWeekTotal)}
          sub={weekVariation != null
            ? `${weekVariation >= 0 ? '+' : ''}${fmtNum(weekVariation, 1)}% vs sem. ant.`
            : 'Sin semana anterior'} />
        <Stat label="Facturación del mes" value={fmt(currentMonthTotal)}
          sub={`${currentMonth.length} días registrados`} />
        <Stat label="Mejor día del mes" value={bestDay ? fmt(bestDay.generated) : '—'}
          sub={bestDay?.date || 'Sin datos'} />
        <Stat label="Balance neto mensual" value={fmt(monthNetBalance)}
          color={monthNetBalance >= 0 ? '#34d399' : '#f87171'}
          sub="generado − gasto" />
      </div>

      {/* ── Week delta chip ── */}
      {weekVariation !== null && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600,
            color: weekVariation >= 0 ? '#34d399' : '#f87171',
            background: weekVariation >= 0 ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)',
            padding: '5px 12px', borderRadius: 20,
          }}>
            {weekVariation >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {weekVariation >= 0 ? '+' : ''}{fmtNum(weekVariation, 1)}% vs semana anterior
          </span>
        </div>
      )}

      {/* ── BarChart ── */}
      {chartData.length > 0 && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div className="mono" style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
            Facturación diaria — últimos 30 días
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9a96ad', fontFamily: 'Manrope' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9a96ad' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#f6f5fa' }}
                formatter={(v: number) => [fmt(v, 2), 'Facturado']}
              />
              <Bar dataKey="generado" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Table ── */}
      {rows.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
            <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>Histórico de pagos</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fecha','Facturación','Variación %','Acum. 7 días','Acum. mensual','Neto día','Neto acum. mes'].map(h => (
                    <th key={h} className="tbl-th" style={{ textAlign: h === 'Fecha' ? 'left' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.date} className="tbl-row">
                    <td className="tbl-td" style={{ fontFamily: 'Manrope, sans-serif' }}>{row.date}</td>
                    <td className="tbl-td right" style={{ fontWeight: 700 }}>{fmt(row.generated)}</td>
                    <td className="tbl-td right">
                      {row.variationPct != null ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600,
                          color: row.variationPct >= 0 ? '#34d399' : '#f87171' }}>
                          {row.variationPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {row.variationPct >= 0 ? '+' : ''}{fmtNum(row.variationPct, 1)}%
                        </span>
                      ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td className="tbl-td right" style={{ color: 'var(--muted)' }}>{fmt(row.weeklyAccum)}</td>
                    <td className="tbl-td right" style={{ color: 'var(--muted)' }}>{fmt(row.monthlyAccum)}</td>
                    <td className="tbl-td right" style={{ fontWeight: 600, color: row.netDay >= 0 ? '#34d399' : '#f87171' }}>
                      {fmt(row.netDay)}
                    </td>
                    <td className="tbl-td right" style={{ fontWeight: 700, color: row.netMonthlyAccum >= 0 ? '#34d399' : '#f87171' }}>
                      {fmt(row.netMonthlyAccum)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--muted)', fontSize: 13 }}>
          No hay registros aún. Agregá el primero en "Nuevo registro".
        </div>
      )}
    </div>
  )
}

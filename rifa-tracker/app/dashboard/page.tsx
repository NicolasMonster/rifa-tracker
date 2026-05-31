'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import MetricCard        from '@/components/MetricCard'
import EntryForm         from '@/components/EntryForm'
import EntriesTable      from '@/components/EntriesTable'
import TrendChart        from '@/components/TrendChart'
import RoasChart         from '@/components/RoasChart'
import PaymentsHistory   from '@/components/PaymentsHistory'
import AdAccountsManager from '@/components/AdAccountsManager'
import { aggregateEntries, fmt, fmtNum, getMonthEntries, getWeekEntries } from '@/lib/metrics'
import type { DailyEntry } from '@/lib/supabase'

type Tab = 'form' | 'history' | 'payments' | 'accounts'
const TABS: { id: Tab; label: string }[] = [
  { id: 'form',     label: 'Nuevo registro'     },
  { id: 'history',  label: 'Historial'          },
  { id: 'payments', label: 'Histórico de pagos' },
  { id: 'accounts', label: 'Cuentas'            },
]
const PERIODS = [7, 14, 30]

export default function Dashboard() {
  const [entries,   setEntries]   = useState<DailyEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<Tab>('form')
  const [period,    setPeriod]    = useState(14)
  const [accounts,  setAccounts]  = useState<number>(0)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/entries?limit=90')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAccountCount = useCallback(async () => {
    try {
      const res  = await fetch('/api/ad-accounts')
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data.filter((a: {is_active:boolean}) => a.is_active).length : 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchEntries(); fetchAccountCount() }, [fetchEntries, fetchAccountCount])

  async function handleDelete(id: string) {
    await fetch(`/api/entries?id=${id}`, { method: 'DELETE' })
    fetchEntries()
  }

  // Slice by period
  const periodEntries = entries.slice(0, period)
  const prevEntries   = entries.slice(period, period * 2)
  const agg     = aggregateEntries(periodEntries)
  const aggPrev = aggregateEntries(prevEntries)
  const delta   = (cur: number, prv: number) => prv > 0 ? ((cur - prv) / prv) * 100 : 0

  // Sparklines (cronológico)
  const chrono = [...periodEntries].sort((a, b) => a.date.localeCompare(b.date))
  const spark = {
    spend:     chrono.map(e => e.spend),
    generated: chrono.map(e => e.generated),
    clientes:  chrono.map(e => e.clientes ?? e.rifas_sold ?? 0),
    ticket:    chrono.map(e => e.ticket_promedio > 0 ? e.ticket_promedio : (e.clientes > 0 ? e.generated / e.clientes : 0)),
  }

  const kpis = [
    { label: 'Invertido',      value: fmt(agg.totalSpend),      delta: delta(agg.totalSpend, aggPrev.totalSpend),           neutral: true, spark: spark.spend     },
    { label: 'Generado',       value: fmt(agg.totalGenerated),  delta: delta(agg.totalGenerated, aggPrev.totalGenerated),   neutral: false, spark: spark.generated },
    { label: 'Clientes',       value: agg.totalClientes.toLocaleString(), delta: delta(agg.totalClientes, aggPrev.totalClientes), neutral: false, spark: spark.clientes  },
    { label: 'Ticket promedio',value: agg.totalClientes > 0 ? fmt(agg.ticketPromedio, 2) : '—',
      delta: delta(agg.ticketPromedio, aggPrev.ticketPromedio),  neutral: false, spark: spark.ticket    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Glow bg ─────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: -200, right: -150, width: 580, height: 440,
        background: 'radial-gradient(closest-side, rgba(6,182,212,.12), rgba(29,158,117,.07), transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: -200, left: -100, width: 400, height: 360,
        background: 'radial-gradient(closest-side, rgba(29,158,117,.08), transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #1D9E75, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
              boxShadow: '0 4px 16px rgba(29,158,117,.35)',
            }}>🎟️</div>
            <div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-.02em', lineHeight: 1, background: 'linear-gradient(90deg,#1D9E75,#06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                Rifa Tracker
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Panel de métricas</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Period selector */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 12, padding: '0 8px 0 14px', height: 44, background: 'var(--input-bg)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Período</span>
              <select value={period} onChange={e => setPeriod(Number(e.target.value))}
                style={{ background: 'transparent', border: 'none', color: 'var(--fg)', fontWeight: 600, fontSize: 13.5, outline: 'none', cursor: 'pointer', height: '100%' }}>
                {PERIODS.map(p => <option key={p} value={p} style={{ background: '#16161f' }}>{p} días</option>)}
              </select>
            </div>
            <button onClick={() => setTab('form')} className="btn-primary" style={{ height: 44 }}>
              <Plus size={14} /> Cargar día
            </button>
          </div>
        </div>

        {/* ── Status bar ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: 'var(--muted)', marginBottom: 22 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 7, height: 7, borderRadius: 4,
              background: accounts > 0 ? '#34d399' : '#fbbf24',
              boxShadow: `0 0 0 3px ${accounts > 0 ? 'rgba(52,211,153,.18)' : 'rgba(251,191,36,.18)'}`,
            }} />
            {accounts > 0 ? `Meta Ads conectado (${accounts} cuenta${accounts > 1 ? 's' : ''})` : 'Sin cuentas conectadas'}
          </span>
          <span style={{ opacity: .4 }}>·</span>
          <span>{periodEntries.length} días en este período</span>
          {entries.length > 0 && (
            <><span style={{ opacity: .4 }}>·</span>
            <span>{entries.length} días totales</span></>
          )}
        </div>

        {/* ── KPI cards ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
          {kpis.map(k => (
            <MetricCard key={k.label} {...k} />
          ))}
        </div>

        {/* ── Charts split ───────────────────────────────────────── */}
        {entries.length > 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, marginBottom: 24, alignItems: 'stretch' }}
            className="trend-split">
            {/* Invertido vs Generado */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>Invertido vs Generado</span>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, borderTop: '2.4px solid #06b6d4', display: 'inline-block' }} /> Generado
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, borderTop: '2.4px dashed #1D9E75', display: 'inline-block' }} /> Invertido
                  </span>
                </div>
              </div>
              <TrendChart entries={periodEntries} />
            </div>

            {/* ROAS card */}
            <div style={{ borderRadius: 20, padding: 2, background: 'linear-gradient(135deg, #1D9E75, #06b6d4)' }}>
              <div style={{ background: '#0f0f18', borderRadius: 18, padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  ROAS del período
                </span>
                <span className="mono" style={{
                  fontWeight: 700, fontSize: 56, letterSpacing: '-.03em', lineHeight: .9,
                  background: 'linear-gradient(90deg,#1D9E75,#06b6d4)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>
                  {fmtNum(agg.roas, 2)}x
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  ${agg.roas.toFixed(2).replace('.', ',')} por cada $1 invertido
                </span>
                <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ganancia neta</span>
                  <span className="mono" style={{ fontWeight: 600, fontSize: 20, marginLeft: 'auto', color: agg.net >= 0 ? '#34d399' : '#f87171' }}>
                    {fmt(agg.net)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>CPA</span>
                  <span className="mono" style={{ fontWeight: 600, fontSize: 16, marginLeft: 'auto', color: 'var(--fg)' }}>
                    {agg.totalClientes > 0 ? fmt(agg.cpa, 2) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROAS evolution chart */}
        {entries.length > 1 && <div style={{ marginBottom: 24 }}><RoasChart entries={periodEntries} /></div>}

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="tab-bar" style={{ marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`tab-btn ${tab === t.id ? 'active' : 'inactive'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ────────────────────────────────────────── */}
        {tab === 'form'     && <EntryForm onSaved={() => { fetchEntries(); fetchAccountCount() }} />}
        {tab === 'history'  && (
          loading
            ? <div className="card" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>Cargando…</div>
            : <EntriesTable entries={entries} onDelete={handleDelete} />
        )}
        {tab === 'payments' && <PaymentsHistory entries={entries} />}
        {tab === 'accounts' && <AdAccountsManager />}
      </div>

      <style>{`
        @media (max-width: 700px) {
          .trend-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

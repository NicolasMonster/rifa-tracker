'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, DollarSign, Target, BarChart2, Users, Ticket } from 'lucide-react'
import MetricCard       from '@/components/MetricCard'
import EntryForm        from '@/components/EntryForm'
import EntriesTable     from '@/components/EntriesTable'
import RoasChart        from '@/components/RoasChart'
import PaymentsHistory  from '@/components/PaymentsHistory'
import AdAccountsManager from '@/components/AdAccountsManager'
import { aggregateEntries, fmt, fmtNum, roasColor } from '@/lib/metrics'
import type { DailyEntry } from '@/lib/supabase'

type Tab = 'form' | 'history' | 'payments' | 'accounts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'form',     label: 'Nuevo registro'     },
  { id: 'history',  label: 'Historial'          },
  { id: 'payments', label: 'Histórico de pagos' },
  { id: 'accounts', label: 'Cuentas'            },
]

export default function Dashboard() {
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<Tab>('form')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/entries?limit=60')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleDelete(id: string) {
    await fetch(`/api/entries?id=${id}`, { method: 'DELETE' })
    fetchEntries()
  }

  const agg = aggregateEntries(entries)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">🎟️ Rifa Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">
          {entries.length > 0 ? `${entries.length} días registrados` : 'Sin registros aún'}
        </p>
      </div>

      {/* ── Summary cards (siempre visibles) ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="ROAS prom."
          value={`${fmtNum(agg.roas)}x`}
          sub="ingresos / gasto"
          valueClass={roasColor(agg.roas)}
          icon={<TrendingUp size={14} />}
        />
        <MetricCard
          label="Gasto total"
          value={fmt(agg.totalSpend)}
          sub="acumulado"
          icon={<DollarSign size={14} />}
        />
        <MetricCard
          label="Generado total"
          value={fmt(agg.totalGenerated)}
          sub="acumulado"
          icon={<BarChart2 size={14} />}
        />
        <MetricCard
          label="Ganancia neta"
          value={fmt(agg.net)}
          valueClass={agg.net >= 0 ? 'text-emerald-400' : 'text-red-400'}
          sub="generado − gasto"
          icon={<Target size={14} />}
        />
        <MetricCard
          label="Clientes"
          value={agg.totalClientes.toLocaleString()}
          sub="total"
          icon={<Users size={14} />}
        />
        <MetricCard
          label="Ticket prom."
          value={agg.totalClientes > 0 ? fmt(agg.ticketPromedio, 2) : '—'}
          sub="generado / clientes"
          icon={<Ticket size={14} />}
        />
      </div>

      {/* ── ROAS Chart (siempre visible si hay datos) ─────────────────── */}
      {entries.length > 1 && <RoasChart entries={entries} />}

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-[#222] rounded-xl border border-[#2e2e2e] w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-brand-400 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      {tab === 'form' && (
        <EntryForm onSaved={fetchEntries} />
      )}

      {tab === 'history' && (
        loading
          ? <div className="card text-center text-gray-500 text-sm py-10">Cargando...</div>
          : <EntriesTable entries={entries} onDelete={handleDelete} />
      )}

      {tab === 'payments' && (
        <PaymentsHistory entries={entries} />
      )}

      {tab === 'accounts' && (
        <AdAccountsManager />
      )}
    </div>
  )
}

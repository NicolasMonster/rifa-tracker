'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, DollarSign, Ticket, Target, BarChart2, Users } from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import EntryForm from '@/components/EntryForm'
import EntriesTable from '@/components/EntriesTable'
import RoasChart from '@/components/RoasChart'
import { aggregateEntries, fmt, fmtNum, roasColor } from '@/lib/metrics'
import type { DailyEntry } from '@/lib/supabase'

export default function Dashboard() {
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'form' | 'history'>('form')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/entries?limit=60')
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">🎟️ Rifa Tracker</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {entries.length > 0 ? `${entries.length} días registrados` : 'Sin registros aún'}
        </p>
      </div>

      {/* Summary metrics */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard
            label="ROAS promedio"
            value={`${fmtNum(agg.roas)}x`}
            sub="ingresos / gasto"
            valueClass={roasColor(agg.roas)}
            icon={<TrendingUp size={15} />}
          />
          <MetricCard
            label="Gasto total"
            value={fmt(agg.totalSpend)}
            sub="acumulado"
            icon={<DollarSign size={15} />}
          />
          <MetricCard
            label="Generado total"
            value={fmt(agg.totalGenerated)}
            sub="acumulado"
            icon={<BarChart2 size={15} />}
          />
          <MetricCard
            label="Ganancia neta"
            value={fmt(agg.net)}
            valueClass={agg.net >= 0 ? 'text-emerald-600' : 'text-red-500'}
            sub="generado − gasto"
            icon={<Target size={15} />}
          />
          <MetricCard
            label="Rifas vendidas"
            value={agg.totalRifas.toLocaleString()}
            sub="total"
            icon={<Ticket size={15} />}
          />
          <MetricCard
            label="CPA promedio"
            value={agg.totalRifas > 0 ? fmt(agg.cpa) : '—'}
            sub="gasto / rifas"
            icon={<Users size={15} />}
          />
        </div>
      )}

      {/* Chart */}
      {entries.length > 1 && <RoasChart entries={entries} />}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['form', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
              tab === t
                ? 'bg-white border-gray-200 text-gray-900 shadow-sm'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'form' ? 'Nuevo registro' : 'Historial'}
          </button>
        ))}
      </div>

      {tab === 'form' && <EntryForm onSaved={fetchEntries} />}

      {tab === 'history' && (
        loading
          ? <div className="card text-center text-gray-400 text-sm py-10">Cargando...</div>
          : <EntriesTable entries={entries} onDelete={handleDelete} />
      )}
    </div>
  )
}

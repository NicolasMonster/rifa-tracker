'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Building2 } from 'lucide-react'
import type { AdAccount } from '@/lib/supabase'

type MetaInsights = {
  spend: number
  impressions: number
  clicks: number
  reach: number
  cpm: number
  ctr: number
}

type Props = { onSaved: () => void }

export default function EntryForm({ onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate]                   = useState(today)
  const [generated, setGenerated]         = useState('')
  const [clientes, setClientes]           = useState('')
  const [ticketPromedio, setTicketPromedio] = useState('')
  const [ticketEdited, setTicketEdited]   = useState(false)
  const [notes, setNotes]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)

  // Meta Ads
  const [meta, setMeta]                   = useState<MetaInsights | null>(null)
  const [perAccount, setPerAccount]       = useState<Record<string, MetaInsights & { name: string }>>({})
  const [metaLoading, setMetaLoading]     = useState(false)
  const [metaError, setMetaError]         = useState('')

  // Ad accounts
  const [accounts, setAccounts]           = useState<AdAccount[]>([])
  const [selectedIds, setSelectedIds]     = useState<string[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ad-accounts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAccounts(data)
          setSelectedIds(data.filter((a: AdAccount) => a.is_active).map((a: AdAccount) => a.id))
        }
      })
      .finally(() => setAccountsLoading(false))
  }, [])

  // Auto-calc ticket promedio
  useEffect(() => {
    if (!ticketEdited) {
      const g = parseFloat(generated)
      const c = parseInt(clientes)
      if (g > 0 && c > 0) {
        setTicketPromedio((g / c).toFixed(2))
      } else {
        setTicketPromedio('')
      }
    }
  }, [generated, clientes, ticketEdited])

  function resetMeta() {
    setMeta(null)
    setPerAccount({})
    setMetaError('')
  }

  function toggleAccount(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    resetMeta()
  }

  async function fetchMeta() {
    if (selectedIds.length === 0) { setMetaError('Seleccioná al menos una cuenta'); return }
    setMetaLoading(true)
    resetMeta()
    try {
      const selected    = accounts.filter(a => selectedIds.includes(a.id))
      const accountIds  = selected.map(a => a.account_id).join(',')
      const res         = await fetch(`/api/meta?date=${date}&accountIds=${accountIds}`)
      const json        = await res.json()

      if (json.error) { setMetaError(json.error); return }

      setMeta(json.total)
      // Enriquecer perAccount con el nombre de la cuenta
      const enriched: Record<string, MetaInsights & { name: string }> = {}
      selected.forEach(a => {
        if (json.perAccount[a.account_id]) {
          enriched[a.id] = { ...json.perAccount[a.account_id], name: a.name }
        }
      })
      setPerAccount(enriched)
    } catch {
      setMetaError('No se pudo conectar con Meta')
    } finally {
      setMetaLoading(false)
    }
  }

  async function handleSave() {
    if (!generated) return alert('Ingresá el monto generado')
    setSaving(true)
    try {
      const body = {
        date,
        spend:           meta?.spend       ?? 0,
        impressions:     meta?.impressions  ?? 0,
        clicks:          meta?.clicks       ?? 0,
        reach:           meta?.reach        ?? 0,
        generated:       parseFloat(generated),
        clientes:        parseInt(clientes) || 0,
        ticket_promedio: parseFloat(ticketPromedio) || 0,
        notes:           notes || null,
      }
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setGenerated('')
      setClientes('')
      setTicketPromedio('')
      setTicketEdited(false)
      setNotes('')
      resetMeta()
      onSaved()
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const multiAccount = Object.values(perAccount).length > 1

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Registrar día</h2>
        {saved && (
          <span className="flex items-center gap-1 text-emerald-400 text-sm">
            <CheckCircle2 size={14} /> Guardado
          </span>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="label">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={e => { setDate(e.target.value); resetMeta() }}
          className="input"
        />
      </div>

      {/* ── Bloque Meta Ads ─────────────────────────────────────────────── */}
      <div className="border border-[#3a3a3a] rounded-xl p-4 bg-[#1f1f1f] space-y-4">
        {/* Header bloque */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meta Ads</span>
            <span className="badge-auto">AUTOMÁTICO</span>
          </div>
          <button
            onClick={fetchMeta}
            disabled={metaLoading || selectedIds.length === 0}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            {metaLoading
              ? <Loader2 size={12} className="animate-spin" />
              : <RefreshCw size={12} />}
            {metaLoading ? 'Cargando...' : 'Traer datos'}
          </button>
        </div>

        {/* Selector de cuentas */}
        {accountsLoading ? (
          <p className="text-xs text-gray-500">Cargando cuentas...</p>
        ) : accounts.length === 0 ? (
          <p className="text-xs text-gray-500">
            No hay cuentas configuradas.{' '}
            <span className="text-brand-400">Andá a la tab "Cuentas" para agregar una.</span>
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Building2 size={11} /> Cuentas a incluir:
            </div>
            <div className="flex flex-wrap gap-2">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => toggleAccount(acc.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                    selectedIds.includes(acc.id)
                      ? 'bg-brand-400/20 border-brand-400/50 text-brand-400'
                      : 'bg-[#2a2a2a] border-[#444] text-gray-500 hover:text-gray-300 hover:border-[#555]'
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {metaError && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle size={13} /> {metaError}
          </div>
        )}

        {/* Resultados */}
        {meta && (
          <div className="space-y-3">
            {/* Desglose por cuenta (solo si hay más de una) */}
            {multiAccount && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Desglose por cuenta:</p>
                {Object.values(perAccount).map(acc => (
                  <div key={acc.name} className="bg-[#2a2a2a] rounded-lg p-3 border border-[#333]">
                    <div className="text-xs font-medium text-gray-300 mb-1.5">{acc.name}</div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Gasto: <strong className="text-white">${acc.spend.toFixed(2)}</strong></span>
                      <span>Clics: <strong className="text-white">{acc.clicks.toLocaleString()}</strong></span>
                      <span>Impr.: <strong className="text-white">{acc.impressions.toLocaleString()}</strong></span>
                      <span>CTR: <strong className="text-white">{acc.ctr.toFixed(2)}%</strong></span>
                    </div>
                  </div>
                ))}
                <p className="text-xs font-semibold text-brand-400">↓ Totales combinados</p>
              </div>
            )}

            {/* Grid métricas combinadas */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Gasto total',  value: `$${meta.spend.toFixed(2)}` },
                { label: 'Impresiones', value: meta.impressions.toLocaleString() },
                { label: 'Clics',       value: meta.clicks.toLocaleString() },
                { label: 'Alcance',     value: meta.reach.toLocaleString() },
                { label: 'CPM',         value: `$${meta.cpm.toFixed(2)}` },
                { label: 'CTR',         value: `${meta.ctr.toFixed(2)}%` },
              ].map(m => (
                <div key={m.label} className="bg-[#2a2a2a] rounded-lg p-2.5 border border-[#333]">
                  <div className="text-xs text-gray-500">{m.label}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!meta && !metaLoading && accounts.length > 0 && (
          <p className="text-xs text-gray-600">
            Seleccioná las cuentas y presioná "Traer datos" para cargar el gasto automáticamente.
          </p>
        )}
      </div>

      {/* ── Manual ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">
            Generado ($) <span className="badge-manual">manual</span>
          </label>
          <input
            type="number"
            value={generated}
            onChange={e => setGenerated(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="input"
          />
        </div>
        <div>
          <label className="label">
            Clientes <span className="badge-manual">manual</span>
          </label>
          <input
            type="number"
            value={clientes}
            onChange={e => setClientes(e.target.value)}
            placeholder="0"
            min="0"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">
          Ticket promedio
          <span className={ticketEdited ? 'badge-manual' : 'badge-auto'}>
            {ticketEdited ? 'manual' : 'auto'}
          </span>
        </label>
        <input
          type="number"
          value={ticketPromedio}
          onChange={e => { setTicketPromedio(e.target.value); setTicketEdited(true) }}
          placeholder="Se calcula automático"
          min="0"
          step="0.01"
          className="input"
        />
        {!ticketEdited && ticketPromedio && (
          <p className="text-xs text-gray-600 mt-1">
            = ${parseFloat(generated || '0').toFixed(2)} / {clientes || '?'} clientes
          </p>
        )}
      </div>

      <div>
        <label className="label">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observaciones del día..."
          rows={2}
          className="input resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? 'Guardando...' : 'Guardar registro'}
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

type MetaData = {
  spend: number
  impressions: number
  clicks: number
  reach: number
  cpm: number
  ctr: number
}

type Props = {
  onSaved: () => void
}

export default function EntryForm({ onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [generated, setGenerated] = useState('')
  const [rifas, setRifas] = useState('')
  const [notes, setNotes] = useState('')
  const [meta, setMeta] = useState<MetaData | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function fetchMeta() {
    setMetaLoading(true)
    setMetaError('')
    setMeta(null)
    try {
      const res = await fetch(`/api/meta?date=${date}`)
      const json = await res.json()
      if (json.error) { setMetaError(json.error); return }
      setMeta(json)
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
        spend:       meta?.spend       ?? 0,
        impressions: meta?.impressions  ?? 0,
        clicks:      meta?.clicks       ?? 0,
        reach:       meta?.reach        ?? 0,
        generated:   parseFloat(generated),
        rifas_sold:  parseInt(rifas) || 0,
        notes:       notes || null,
      }
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setGenerated('')
      setRifas('')
      setNotes('')
      setMeta(null)
      onSaved()
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Registrar día</h2>
        {saved && (
          <span className="flex items-center gap-1 text-emerald-600 text-sm">
            <CheckCircle2 size={14} /> Guardado
          </span>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="label">Fecha</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
      </div>

      {/* Bloque Meta */}
      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Meta Ads (automático)</span>
          <button
            onClick={fetchMeta}
            disabled={metaLoading}
            className="btn-ghost flex items-center gap-1 text-xs py-1 px-3"
          >
            {metaLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {metaLoading ? 'Cargando...' : 'Traer datos'}
          </button>
        </div>

        {metaError && (
          <div className="flex items-center gap-2 text-red-500 text-xs">
            <AlertCircle size={13} /> {metaError}
          </div>
        )}

        {meta ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Gasto', value: `$${meta.spend.toFixed(2)}` },
              { label: 'Impresiones', value: meta.impressions.toLocaleString() },
              { label: 'Clics', value: meta.clicks.toLocaleString() },
              { label: 'Alcance', value: meta.reach.toLocaleString() },
              { label: 'CPM', value: `$${meta.cpm.toFixed(2)}` },
              { label: 'CTR', value: `${meta.ctr.toFixed(2)}%` },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-lg p-2 border border-gray-100">
                <div className="text-xs text-gray-400">{m.label}</div>
                <div className="text-sm font-semibold text-gray-800">{m.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Presioná "Traer datos" para cargar el gasto de Meta automáticamente.</p>
        )}
      </div>

      {/* Manual */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Generado ($) *</label>
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
          <label className="label">Rifas vendidas</label>
          <input
            type="number"
            value={rifas}
            onChange={e => setRifas(e.target.value)}
            placeholder="0"
            min="0"
            className="input"
          />
        </div>
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

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? 'Guardando...' : 'Guardar registro'}
      </button>
    </div>
  )
}

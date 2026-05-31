'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Building2 } from 'lucide-react'
import type { AdAccount } from '@/lib/supabase'

type MetaInsights = {
  spend: number; impressions: number; clicks: number; reach: number; cpm: number; ctr: number
}

type Props = { onSaved: () => void }

export default function EntryForm({ onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate]             = useState(today)
  const [generated, setGenerated]   = useState('')
  const [clientes, setClientes]     = useState('')
  const [ticket, setTicket]         = useState('')
  const [ticketEdited, setTicketEdited] = useState(false)
  const [notes, setNotes]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  const [meta, setMeta]             = useState<MetaInsights | null>(null)
  const [perAccount, setPerAccount] = useState<Record<string, MetaInsights & { name: string }>>({})
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError]   = useState('')

  const [accounts, setAccounts]     = useState<AdAccount[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ad-accounts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setAccounts(data)
        setSelectedIds(data.filter((a: AdAccount) => a.is_active).map((a: AdAccount) => a.id))
      }
    }).finally(() => setAccountsLoading(false))
  }, [])

  // Auto-calc ticket
  useEffect(() => {
    if (!ticketEdited) {
      const g = parseFloat(generated), c = parseInt(clientes)
      setTicket(g > 0 && c > 0 ? (g / c).toFixed(2) : '')
    }
  }, [generated, clientes, ticketEdited])

  function resetMeta() { setMeta(null); setPerAccount({}); setMetaError('') }

  function toggleAccount(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    resetMeta()
  }

  async function fetchMeta() {
    if (!selectedIds.length) { setMetaError('Seleccioná al menos una cuenta'); return }
    setMetaLoading(true); resetMeta()
    try {
      const selected   = accounts.filter(a => selectedIds.includes(a.id))
      const accountIds = selected.map(a => a.account_id).join(',')
      const res  = await fetch(`/api/meta?date=${date}&accountIds=${accountIds}`)
      const json = await res.json()
      if (json.error) { setMetaError(json.error); return }
      setMeta(json.total)
      const enriched: Record<string, MetaInsights & { name: string }> = {}
      selected.forEach(a => {
        if (json.perAccount[a.account_id]) enriched[a.id] = { ...json.perAccount[a.account_id], name: a.name }
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
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          spend:           meta?.spend ?? 0,
          impressions:     meta?.impressions ?? 0,
          clicks:          meta?.clicks ?? 0,
          reach:           meta?.reach ?? 0,
          generated:       parseFloat(generated),
          clientes:        parseInt(clientes) || 0,
          ticket_promedio: parseFloat(ticket) || 0,
          notes:           notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setGenerated(''); setClientes(''); setTicket(''); setTicketEdited(false); setNotes('')
      resetMeta()
      onSaved()
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Error al guardar') }
    finally { setSaving(false) }
  }

  const multiAccount = Object.values(perAccount).length > 1
  const Divider = () => <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />

  return (
    <div className="card" style={{ padding: 26 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="mono" style={{ fontWeight: 600, fontSize: 19 }}>Registrar día</span>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 13.5 }}>
            <CheckCircle2 size={15} /> Guardado
          </span>
        )}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 22 }}>
        El gasto de Meta se trae automático; el resto lo cargás vos.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Fecha */}
        <div>
          <label className="label">Fecha</label>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); resetMeta() }} className="input" />
        </div>

        {/* ── META ADS block ── */}
        <div style={{ background: 'rgba(29,158,117,.05)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: '.04em' }}>META ADS</span>
              <span className="badge-auto">Automático</span>
            </div>
            {accounts.length > 0 && (
              <button onClick={fetchMeta} disabled={metaLoading || !selectedIds.length} className="btn-ghost btn-sm">
                {metaLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {metaLoading ? 'Trayendo…' : (meta ? 'Volver a traer' : 'Traer de Meta')}
              </button>
            )}
          </div>

          {/* Account selector */}
          {accountsLoading ? (
            <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>Cargando cuentas…</p>
          ) : accounts.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              No hay cuentas configuradas.{' '}
              <span style={{ color: '#06b6d4', cursor: 'pointer', fontWeight: 600 }}>Conectá una en la tab "Cuentas" →</span>
            </p>
          ) : (
            <div style={{ marginBottom: meta ? 14 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                <Building2 size={11} /> Cuentas a incluir:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {accounts.map(acc => {
                  const isSelected = selectedIds.includes(acc.id)
                  return (
                    <button key={acc.id} onClick={() => toggleAccount(acc.id)} style={{
                      padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      border: `1px solid ${isSelected ? 'rgba(29,158,117,.5)' : 'var(--border)'}`,
                      background: isSelected ? 'rgba(29,158,117,.15)' : 'rgba(255,255,255,.03)',
                      color: isSelected ? '#1D9E75' : 'var(--muted)',
                      cursor: 'pointer', transition: 'all .12s',
                    }}>
                      {acc.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {metaError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: 13, marginTop: 12 }}>
              <AlertCircle size={13} /> {metaError}
            </div>
          )}

          {/* Results */}
          {meta && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Per-account breakdown */}
              {multiAccount && (
                <>
                  <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>Desglose por cuenta:</p>
                  {Object.values(perAccount).map(acc => (
                    <div key={acc.name} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg)', marginBottom: 8 }}>{acc.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                        <span>Gasto: <strong style={{ color: 'var(--fg)' }}>${acc.spend.toFixed(2)}</strong></span>
                        <span>Clics: <strong style={{ color: 'var(--fg)' }}>{acc.clicks.toLocaleString()}</strong></span>
                        <span>CTR: <strong style={{ color: 'var(--fg)' }}>{acc.ctr.toFixed(2)}%</strong></span>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: '#1D9E75' }}>↓ Totales combinados</p>
                </>
              )}

              {/* Metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Gasto total',  value: `$${meta.spend.toFixed(2)}` },
                  { label: 'Impresiones',  value: meta.impressions.toLocaleString() },
                  { label: 'Clics',        value: meta.clicks.toLocaleString() },
                  { label: 'Alcance',      value: meta.reach.toLocaleString() },
                  { label: 'CPM',          value: `$${meta.cpm.toFixed(2)}` },
                  { label: 'CTR',          value: `${meta.ctr.toFixed(2)}%` },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{m.label}</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Manual fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Generado <span className="badge-manual">Manual</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 14px', height: 48 }}>
              <span style={{ color: 'var(--muted)', fontFamily: 'Space Grotesk', fontSize: 16 }}>$</span>
              <input value={generated} onChange={e => setGenerated(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="0" type="text" inputMode="decimal"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)', fontFamily: 'Space Grotesk, monospace', fontSize: 15, fontWeight: 500 }} />
            </div>
          </div>
          <div>
            <label className="label">Clientes <span className="badge-manual">Manual</span></label>
            <input value={clientes} onChange={e => setClientes(e.target.value.replace(/\D/g, ''))}
              placeholder="0" className="input" />
          </div>
        </div>

        <div>
          <label className="label">
            Ticket promedio
            <span className={ticketEdited ? 'badge-manual' : 'badge-auto'}>{ticketEdited ? 'Manual' : 'Auto'}</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: ticketEdited ? 'var(--input-bg)' : 'rgba(255,255,255,.02)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 14px', height: 48 }}>
            <span style={{ color: 'var(--muted)', fontFamily: 'Space Grotesk', fontSize: 16 }}>$</span>
            <input value={ticket} readOnly={!ticketEdited}
              onChange={e => setTicket(e.target.value)}
              onFocus={() => setTicketEdited(true)}
              placeholder="Se calcula solo"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: ticketEdited ? 'var(--fg)' : 'var(--muted)', fontFamily: 'Space Grotesk, monospace', fontSize: 15, fontWeight: 500 }} />
          </div>
          {!ticketEdited && ticket && (
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 5 }}>
              = ${parseFloat(generated || '0').toFixed(2)} / {clientes || '?'} clientes
            </p>
          )}
        </div>

        <div>
          <label className="label">Notas <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones del día…" rows={2} className="input" />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%' }}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Guardando…' : 'Guardar registro'}
        </button>
      </div>
    </div>
  )
}

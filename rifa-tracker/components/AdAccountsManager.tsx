'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Building2, Edit2, X, Check, RefreshCw } from 'lucide-react'
import type { AdAccount, Campaign } from '@/lib/supabase'

// ─── Campaign Selector Panel ──────────────────────────────────────────────
function CampaignPanel({ account, onClose, onSaved }: {
  account: AdAccount
  onClose: () => void
  onSaved: () => void
}) {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [saving, setSaving]         = useState(false)

  const initial: string[] = (() => {
    try { return JSON.parse(account.selected_campaign_ids || '[]') } catch { return [] }
  })()
  const [selected, setSelected] = useState<string[]>(initial)

  async function fetchCampaigns() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`/api/meta/campaigns?accountId=${account.account_id}`)
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setCampaigns(data)
    } catch {
      setError('No se pudo conectar con Meta')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/ad-accounts?id=${account.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ selected_campaign_ids: JSON.stringify(selected) }),
      })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const statusColor = (s: string) =>
    s === 'ACTIVE' ? '#34d399' : s === 'PAUSED' ? '#fbbf24' : '#9a96ad'
  const statusLabel = (s: string) =>
    ({ ACTIVE: 'Activa', PAUSED: 'Pausada', ARCHIVED: 'Archivada', DELETED: 'Eliminada' }[s] || s)

  return (
    <div style={{
      background: '#0f0f18',
      border: '1px solid rgba(29,158,117,.3)',
      borderRadius: 14,
      padding: 20,
      marginTop: 8,
    }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg)' }}>
            Campañas — {account.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
            {selected.length === 0
              ? 'Sin filtro — se incluyen todas las campañas'
              : `${selected.length} campaña${selected.length > 1 ? 's' : ''} seleccionada${selected.length > 1 ? 's' : ''}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchCampaigns} className="btn-ghost btn-sm" title="Recargar">
            <RefreshCw size={12} />
          </button>
          <button onClick={onClose} className="btn-ghost btn-sm">
            <X size={12} /> Cerrar
          </button>
        </div>
      </div>

      {/* Quick actions */}
      {campaigns.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setSelected(campaigns.map(c => c.id))} className="btn-ghost btn-sm" style={{ fontSize: 11.5 }}>
            Seleccionar todas
          </button>
          <button onClick={() => setSelected([])} className="btn-ghost btn-sm" style={{ fontSize: 11.5 }}>
            Deseleccionar todas
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ color: '#f87171', fontSize: 13, padding: '10px 14px', background: 'rgba(248,113,113,.08)', borderRadius: 10, marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>
          <Loader2 size={14} className="animate-spin" /> Cargando campañas…
        </div>
      )}

      {/* Campaign list */}
      {!loading && campaigns.length === 0 && !error && (
        <div style={{ color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>
          No se encontraron campañas en esta cuenta.
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {campaigns.map(c => {
            const isSelected = selected.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${isSelected ? 'rgba(29,158,117,.4)' : 'rgba(255,255,255,.06)'}`,
                  background: isSelected ? 'rgba(29,158,117,.1)' : 'rgba(255,255,255,.02)',
                  cursor: 'pointer',
                  transition: 'all .12s',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {/* Checkbox visual */}
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${isSelected ? '#1D9E75' : 'rgba(255,255,255,.2)'}`,
                  background: isSelected ? '#1D9E75' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .12s',
                }}>
                  {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>

                {/* Campaign info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Space Grotesk, monospace', marginTop: 1 }}>
                    ID: {c.id}
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                  color: statusColor(c.effective_status),
                  background: `${statusColor(c.effective_status)}20`,
                  padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                }}>
                  {statusLabel(c.effective_status)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <button onClick={onClose} className="btn-ghost btn-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
            {saving && <Loader2 size={12} className="animate-spin" />}
            {saving ? 'Guardando…' : 'Guardar selección'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function AdAccountsManager() {
  const [accounts, setAccounts]     = useState<AdAccount[]>([])
  const [loading, setLoading]       = useState(true)
  const [name, setName]             = useState('')
  const [accountId, setAccountId]   = useState('')
  const [adding, setAdding]         = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)  // account with open campaign panel

  async function fetchAccounts() {
    setLoading(true)
    try {
      const res  = await fetch('/api/ad-accounts')
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAccounts() }, [])

  async function handleAdd() {
    if (!name.trim() || !accountId.trim()) return alert('Completá el nombre y el ID de cuenta')
    const id = accountId.trim().startsWith('act_') ? accountId.trim() : `act_${accountId.trim()}`
    setAdding(true)
    try {
      const res = await fetch('/api/ad-accounts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), account_id: id }),
      })
      if (!res.ok) { const e = await res.json(); alert(e.error || 'Error'); return }
      setName(''); setAccountId('')
      fetchAccounts()
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(acc: AdAccount) {
    await fetch(`/api/ad-accounts?id=${acc.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_active: !acc.is_active }),
    })
    fetchAccounts()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cuenta?')) return
    await fetch(`/api/ad-accounts?id=${id}`, { method: 'DELETE' })
    if (editingId === id) setEditingId(null)
    fetchAccounts()
  }

  function parseCampaignCount(acc: AdAccount) {
    try {
      const ids = JSON.parse(acc.selected_campaign_ids || '[]')
      return Array.isArray(ids) ? ids.length : 0
    } catch { return 0 }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Formulario agregar ────────────────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Building2 size={16} style={{ color: '#1D9E75' }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Agregar cuenta publicitaria</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Todas las cuentas usan el <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 6px', borderRadius: 5, fontSize: 11.5 }}>META_ACCESS_TOKEN</code> del servidor.
          Podés filtrar por campañas específicas con el ícono ✏️ de cada cuenta.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="label">Nombre de la cuenta</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Rifa Principal" className="input" />
          </div>
          <div>
            <label className="label">ID de cuenta</label>
            <input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="act_123456789" className="input" />
          </div>
        </div>

        <button onClick={handleAdd} disabled={adding} className="btn-primary">
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {adding ? 'Agregando…' : 'Agregar cuenta'}
        </button>
      </div>

      {/* ── Lista de cuentas ──────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            Cuentas configuradas
            {accounts.length > 0 && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>({accounts.length})</span>}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{accounts.filter(a => a.is_active).length} activas</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando…</div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No hay cuentas configuradas.<br />
            <span style={{ color: '#4a4760' }}>Agregá tu primera cuenta arriba.</span>
          </div>
        ) : (
          <div>
            {accounts.map(acc => {
              const campaignCount = parseCampaignCount(acc)
              const isEditing     = editingId === acc.id

              return (
                <div key={acc.id}>
                  {/* ── Account row ── */}
                  <div className="tbl-row" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Status dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                      background: acc.is_active ? '#34d399' : '#4a4760',
                      boxShadow: acc.is_active ? '0 0 0 3px rgba(52,211,153,.18)' : 'none',
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{acc.name}</span>
                        <span className={acc.is_active ? 'badge-ok' : 'badge-manual'}>
                          {acc.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                        {campaignCount > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#06b6d4', background: 'rgba(6,182,212,.14)', padding: '2px 8px', borderRadius: 20 }}>
                            {campaignCount} campaña{campaignCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'Space Grotesk, monospace', marginTop: 2 }}>
                        {acc.account_id}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* ✏️ Pencil — campaign selector */}
                      <button
                        onClick={() => setEditingId(isEditing ? null : acc.id)}
                        title="Seleccionar campañas"
                        style={{
                          background: isEditing ? 'rgba(29,158,117,.18)' : 'transparent',
                          border: `1px solid ${isEditing ? 'rgba(29,158,117,.4)' : 'transparent'}`,
                          borderRadius: 8,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          color: isEditing ? '#1D9E75' : 'var(--muted)',
                          display: 'flex', alignItems: 'center',
                          transition: 'all .12s',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Toggle */}
                      <button onClick={() => handleToggle(acc)} title={acc.is_active ? 'Desactivar' : 'Activar'}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', color: acc.is_active ? '#1D9E75' : 'var(--muted)' }}>
                        {acc.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>

                      {/* Trash */}
                      <button onClick={() => handleDelete(acc.id)} title="Eliminar"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', color: 'var(--muted)', transition: 'color .12s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* ── Campaign panel (inline) ── */}
                  {isEditing && (
                    <div style={{ padding: '0 24px 20px' }}>
                      <CampaignPanel
                        account={acc}
                        onClose={() => setEditingId(null)}
                        onSaved={fetchAccounts}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="card" style={{ background: 'rgba(255,255,255,.015)', borderColor: 'rgba(255,255,255,.05)' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: '#9a96ad' }}>¿Cómo funciona?</strong><br />
          Hacé click en ✏️ en cualquier cuenta para elegir qué campañas incluir en el gasto diario.
          Si no seleccionás nada, se suma <em>todo</em> el gasto de la cuenta.
          Si seleccionás campañas, sólo se contabiliza el gasto de esas campañas — el CPA y CTR se calculan sobre el total combinado.
        </p>
      </div>
    </div>
  )
}

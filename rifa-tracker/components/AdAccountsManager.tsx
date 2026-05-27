'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Building2 } from 'lucide-react'
import type { AdAccount } from '@/lib/supabase'

export default function AdAccountsManager() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading]   = useState(true)
  const [name, setName]         = useState('')
  const [accountId, setAccountId] = useState('')
  const [adding, setAdding]     = useState(false)

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
    if (!name.trim() || !accountId.trim()) {
      alert('Completá el nombre y el ID de cuenta')
      return
    }
    const id = accountId.trim().startsWith('act_')
      ? accountId.trim()
      : `act_${accountId.trim()}`

    setAdding(true)
    try {
      const res = await fetch('/api/ad-accounts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), account_id: id }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Error al agregar la cuenta')
        return
      }
      setName('')
      setAccountId('')
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
    if (!confirm('¿Eliminar esta cuenta publicitaria?')) return
    await fetch(`/api/ad-accounts?id=${id}`, { method: 'DELETE' })
    fetchAccounts()
  }

  return (
    <div className="space-y-5">
      {/* Formulario agregar */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-brand-400" />
          <h2 className="font-semibold text-white">Agregar cuenta publicitaria</h2>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Podés agregar múltiples cuentas de Meta Ads. Todas comparten el{' '}
          <code className="bg-[#333] px-1.5 py-0.5 rounded text-gray-300 font-mono text-xs">
            META_ACCESS_TOKEN
          </code>{' '}
          configurado en las variables de entorno del servidor.
          <br />
          Al traer datos en el formulario, podés elegir cuáles cuentas incluir —
          el gasto y el CPA se calculan sobre el total combinado.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre de la cuenta</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Rifa Principal"
              className="input"
            />
          </div>
          <div>
            <label className="label">ID de cuenta</label>
            <input
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="act_123456789"
              className="input"
            />
            <p className="text-xs text-gray-600 mt-1">Formato: act_XXXXXXXXX</p>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={adding}
          className="btn-primary flex items-center gap-2"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {adding ? 'Agregando...' : 'Agregar cuenta'}
        </button>
      </div>

      {/* Lista de cuentas */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-[#333] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            Cuentas configuradas
            {accounts.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500">({accounts.length})</span>
            )}
          </h3>
          <span className="text-xs text-gray-600">
            {accounts.filter(a => a.is_active).length} activas
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm">Cargando...</div>
        ) : accounts.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">
            No hay cuentas configuradas.
            <br />
            <span className="text-gray-600">Agregá tu primera cuenta arriba.</span>
          </div>
        ) : (
          <div className="divide-y divide-[#2b2b2b]">
            {accounts.map(acc => (
              <div key={acc.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      acc.is_active ? 'bg-brand-400' : 'bg-[#444]'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{acc.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{acc.account_id}</div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    acc.is_active
                      ? 'bg-brand-400/15 text-brand-400'
                      : 'bg-[#333] text-gray-500'
                  }`}>
                    {acc.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(acc)}
                    title={acc.is_active ? 'Desactivar' : 'Activar'}
                    className="text-gray-500 hover:text-brand-400 transition-colors"
                  >
                    {acc.is_active
                      ? <ToggleRight size={22} className="text-brand-400" />
                      : <ToggleLeft  size={22} />}
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info extra */}
      <div className="card bg-[#1f1f1f] border-[#2a2a2a] text-xs text-gray-500 space-y-1.5">
        <p className="font-medium text-gray-400">¿Cómo funciona el multi-cuenta?</p>
        <p>Al registrar un día, seleccionás qué cuentas incluir. Si seleccionás 2 cuentas:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong className="text-gray-300">Gasto total</strong> = suma del gasto de ambas cuentas</li>
          <li><strong className="text-gray-300">CTR combinado</strong> = clics totales / impresiones totales × 100</li>
          <li><strong className="text-gray-300">CPM combinado</strong> = gasto total / impresiones totales × 1000</li>
          <li><strong className="text-gray-300">CPA</strong> = gasto total / clientes (ingresado manual)</li>
        </ul>
      </div>
    </div>
  )
}

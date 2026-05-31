'use client'

import { Trash2 } from 'lucide-react'
import type { DailyEntry } from '@/lib/supabase'
import { computeMetrics, fmt, fmtNum, roasBg } from '@/lib/metrics'

type Props = {
  entries: DailyEntry[]
  onDelete: (id: string) => void
}

export default function EntriesTable({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--muted)', fontSize: 13 }}>
        Aún no hay registros. Cargá el primero desde "Nuevo registro".
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontWeight: 600, fontSize: 16 }}>Historial</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{entries.length} registros</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 740 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Fecha','Invertido','Generado','Clientes','Ticket','ROAS','Ganancia neta','CTR',''].map((h, i) => (
                <th key={h + i} className={`tbl-th ${i > 0 ? 'right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(raw => {
              const e        = computeMetrics(raw)
              const clientes = raw.clientes ?? raw.rifas_sold ?? 0
              const ticket   = raw.ticket_promedio > 0 ? raw.ticket_promedio : (clientes > 0 ? raw.generated / clientes : 0)
              const roas     = e.roas ?? 0
              const net      = e.net  ?? 0

              return (
                <tr key={e.id} className="tbl-row">
                  {/* Fecha */}
                  <td className="tbl-td" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {e.date}
                  </td>
                  {/* Invertido */}
                  <td className="tbl-td right" style={{ color: 'var(--muted)' }}>{fmt(e.spend, 2)}</td>
                  {/* Generado */}
                  <td className="tbl-td right" style={{ fontWeight: 700 }}>{fmt(e.generated, 2)}</td>
                  {/* Clientes */}
                  <td className="tbl-td right" style={{ color: 'var(--muted)' }}>{clientes}</td>
                  {/* Ticket */}
                  <td className="tbl-td right" style={{ color: 'var(--muted)' }}>{ticket > 0 ? fmt(ticket, 2) : '—'}</td>
                  {/* ROAS */}
                  <td className="tbl-td right">
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, ...roasBgStyle(roas) }}>
                      {fmtNum(roas, 2)}x
                    </span>
                  </td>
                  {/* Ganancia neta */}
                  <td className="tbl-td right" style={{ fontWeight: 600, color: net >= 0 ? '#34d399' : '#f87171' }}>
                    {fmt(net, 2)}
                  </td>
                  {/* CTR */}
                  <td className="tbl-td right" style={{ color: 'var(--muted)' }}>{fmtNum(e.ctr ?? 0, 2)}%</td>
                  {/* Delete */}
                  <td className="tbl-td" style={{ padding: '14px 12px' }}>
                    <button
                      onClick={() => { if (confirm('¿Eliminar este registro?')) onDelete(e.id) }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', color: 'var(--muted)', transition: 'color .12s' }}
                      onMouseEnter={e2 => (e2.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e2 => (e2.currentTarget.style.color = 'var(--muted)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* Footer totals */}
          {entries.length > 1 && (() => {
            const totSpend   = entries.reduce((s, e) => s + e.spend, 0)
            const totGen     = entries.reduce((s, e) => s + e.generated, 0)
            const totCli     = entries.reduce((s, e) => s + (e.clientes ?? e.rifas_sold ?? 0), 0)
            const totTicket  = totCli > 0 ? totGen / totCli : 0
            const totRoas    = totSpend > 0 ? totGen / totSpend : 0
            const totNet     = totGen - totSpend
            return (
              <tfoot>
                <tr style={{ background: 'rgba(255,255,255,.025)' }}>
                  <td className="tbl-td" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700 }}>
                    Total · {entries.length}d
                  </td>
                  <td className="tbl-td right" style={{ fontWeight: 700 }}>{fmt(totSpend, 2)}</td>
                  <td className="tbl-td right" style={{ fontWeight: 700 }}>{fmt(totGen, 2)}</td>
                  <td className="tbl-td right" style={{ fontWeight: 700 }}>{totCli.toLocaleString()}</td>
                  <td className="tbl-td right" style={{ fontWeight: 700 }}>{totTicket > 0 ? fmt(totTicket, 2) : '—'}</td>
                  <td className="tbl-td right" style={{ fontWeight: 700, color: '#06b6d4' }}>{fmtNum(totRoas, 2)}x</td>
                  <td className="tbl-td right" style={{ fontWeight: 700, color: totNet >= 0 ? '#34d399' : '#f87171' }}>{fmt(totNet, 2)}</td>
                  <td className="tbl-td right" style={{ fontWeight: 700 }}>—</td>
                  <td />
                </tr>
              </tfoot>
            )
          })()}
        </table>
      </div>
    </div>
  )
}

function roasBgStyle(roas: number) {
  if (roas >= 2) return { color: '#34d399', background: 'rgba(52,211,153,.14)' }
  if (roas >= 1) return { color: '#fbbf24', background: 'rgba(251,191,36,.14)' }
  return { color: '#f87171', background: 'rgba(248,113,113,.14)' }
}

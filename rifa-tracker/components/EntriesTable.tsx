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
      <div className="card text-center py-12 text-gray-500 text-sm">
        Aún no hay registros. Agregá el primero en "Nuevo registro".
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#333]">
            {['Fecha', 'Gasto', 'Generado', 'ROAS', 'Ganancia neta', 'Clientes', 'Ticket prom.', 'CTR', ''].map(h => (
              <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(raw => {
            const e        = computeMetrics(raw)
            const clientes = raw.clientes ?? raw.rifas_sold ?? 0
            const ticket   = raw.ticket_promedio > 0
              ? raw.ticket_promedio
              : (clientes > 0 ? raw.generated / clientes : 0)

            return (
              <tr key={e.id} className="border-b border-[#2b2b2b] hover:bg-[#2f2f2f] transition-colors">
                <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">{e.date}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmt(e.spend, 2)}</td>
                <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{fmt(e.generated, 2)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${roasBg(e.roas!)}`}>
                    {fmtNum(e.roas!, 2)}x
                  </span>
                </td>
                <td className={`px-4 py-3 font-medium whitespace-nowrap ${(e.net ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(e.net!, 2)}
                </td>
                <td className="px-4 py-3 text-gray-400">{clientes}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {ticket > 0 ? fmt(ticket, 2) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {fmtNum(e.ctr!, 2)}%
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { if (confirm('¿Eliminar este registro?')) onDelete(e.id) }}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

import type { DailyEntry } from './supabase'

export function computeMetrics(entry: DailyEntry): DailyEntry {
  const clientes = entry.clientes ?? entry.rifas_sold ?? 0
  const roas = entry.spend > 0 ? entry.generated / entry.spend : 0
  const net  = entry.generated - entry.spend
  const cpa  = clientes > 0 ? entry.spend / clientes : 0
  const ctr  = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0
  const cpm  = entry.impressions > 0 ? (entry.spend / entry.impressions) * 1000 : 0
  return { ...entry, roas, net, cpa, ctr, cpm }
}

export function aggregateEntries(entries: DailyEntry[]) {
  const totalSpend       = entries.reduce((s, e) => s + (e.spend       ?? 0), 0)
  const totalGenerated   = entries.reduce((s, e) => s + (e.generated   ?? 0), 0)
  const totalClientes    = entries.reduce((s, e) => s + (e.clientes ?? e.rifas_sold ?? 0), 0)
  const totalImpressions = entries.reduce((s, e) => s + (e.impressions ?? 0), 0)
  const totalClicks      = entries.reduce((s, e) => s + (e.clicks      ?? 0), 0)

  return {
    totalSpend,
    totalGenerated,
    totalClientes,
    totalImpressions,
    totalClicks,
    roas: totalSpend > 0 ? totalGenerated / totalSpend : 0,
    net:  totalGenerated - totalSpend,
    cpa:  totalClientes > 0 ? totalSpend / totalClientes : 0,
    ctr:  totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpm:  totalImpressions > 0 ? (totalSpend  / totalImpressions) * 1000 : 0,
    ticketPromedio: totalClientes > 0 ? totalGenerated / totalClientes : 0,
  }
}

export function fmt(n: number, decimals = 0) {
  return '$' + n.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtNum(n: number, decimals = 2) {
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function roasColor(roas: number) {
  if (roas >= 2) return 'text-emerald-400'
  if (roas >= 1) return 'text-amber-400'
  return 'text-red-400'
}

export function roasBg(roas: number) {
  if (roas >= 2) return 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/30'
  if (roas >= 1) return 'bg-amber-900/30 text-amber-400 border border-amber-800/30'
  return 'bg-red-900/30 text-red-400 border border-red-800/30'
}

// ─── Billing history ────────────────────────────────────────────────────────

export type PaymentRow = {
  date: string
  generated: number
  variationPct: number | null
  weeklyAccum: number
  monthlyAccum: number
  netDay: number
  netMonthlyAccum: number
}

export function getWeekEntries(entries: DailyEntry[], weekOffset = 0): DailyEntry[] {
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7 // Lun = 0
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek - weekOffset * 7)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  const startStr = weekStart.toISOString().slice(0, 10)
  const endStr   = weekEnd.toISOString().slice(0, 10)
  return entries.filter(e => e.date >= startStr && e.date < endStr)
}

export function getMonthEntries(entries: DailyEntry[], monthOffset = 0): DailyEntry[] {
  const now    = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
  const monthStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
  return entries.filter(e => e.date.startsWith(monthStr))
}

export function computePaymentsHistory(entries: DailyEntry[]): PaymentRow[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  const rows: PaymentRow[] = sorted.map((e, i) => {
    const prev = sorted[i - 1]
    const variationPct =
      prev && prev.generated > 0
        ? ((e.generated - prev.generated) / prev.generated) * 100
        : null

    // Últimos 7 días incluyendo hoy
    const cutoff = new Date(e.date + 'T00:00:00')
    cutoff.setDate(cutoff.getDate() - 6)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const weeklyAccum = sorted
      .filter(x => x.date >= cutoffStr && x.date <= e.date)
      .reduce((s, x) => s + x.generated, 0)

    const monthStr    = e.date.slice(0, 7)
    const monthlyAccum = sorted
      .filter(x => x.date.startsWith(monthStr) && x.date <= e.date)
      .reduce((s, x) => s + x.generated, 0)

    const netMonthlyAccum = sorted
      .filter(x => x.date.startsWith(monthStr) && x.date <= e.date)
      .reduce((s, x) => s + (x.generated - x.spend), 0)

    return {
      date: e.date,
      generated: e.generated,
      variationPct,
      weeklyAccum,
      monthlyAccum,
      netDay: e.generated - e.spend,
      netMonthlyAccum,
    }
  })

  return rows.reverse() // desc (más reciente primero)
}

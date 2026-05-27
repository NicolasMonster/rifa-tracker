import type { DailyEntry } from './supabase'

export function computeMetrics(entry: DailyEntry): DailyEntry {
  const roas = entry.spend > 0 ? entry.generated / entry.spend : 0
  const net = entry.generated - entry.spend
  const cpa = entry.rifas_sold > 0 ? entry.spend / entry.rifas_sold : 0
  const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0
  const cpm = entry.impressions > 0 ? (entry.spend / entry.impressions) * 1000 : 0
  return { ...entry, roas, net, cpa, ctr, cpm }
}

export function aggregateEntries(entries: DailyEntry[]) {
  const totalSpend = entries.reduce((s, e) => s + e.spend, 0)
  const totalGenerated = entries.reduce((s, e) => s + e.generated, 0)
  const totalRifas = entries.reduce((s, e) => s + e.rifas_sold, 0)
  const totalImpressions = entries.reduce((s, e) => s + e.impressions, 0)
  const totalClicks = entries.reduce((s, e) => s + e.clicks, 0)

  return {
    totalSpend,
    totalGenerated,
    totalRifas,
    totalImpressions,
    totalClicks,
    roas: totalSpend > 0 ? totalGenerated / totalSpend : 0,
    net: totalGenerated - totalSpend,
    cpa: totalRifas > 0 ? totalSpend / totalRifas : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
  }
}

export function fmt(n: number, decimals = 0) {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtNum(n: number, decimals = 2) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function roasColor(roas: number) {
  if (roas >= 2) return 'text-emerald-600'
  if (roas >= 1) return 'text-amber-500'
  return 'text-red-500'
}

export function roasBg(roas: number) {
  if (roas >= 2) return 'bg-emerald-50 text-emerald-700'
  if (roas >= 1) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-600'
}

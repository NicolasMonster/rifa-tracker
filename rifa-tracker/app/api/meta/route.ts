import { NextRequest, NextResponse } from 'next/server'

const META_API = 'https://graph.facebook.com/v19.0'
const TOKEN    = process.env.META_ACCESS_TOKEN

type Insights = {
  spend: number
  impressions: number
  clicks: number
  reach: number
  cpm: number
  ctr: number
}

async function fetchAccountInsights(accountId: string, date: string): Promise<Insights> {
  const fields = 'spend,impressions,clicks,reach,cpm,ctr'
  const range  = JSON.stringify({ since: date, until: date })
  const url    = `${META_API}/${accountId}/insights?fields=${fields}&time_range=${range}&level=account&access_token=${TOKEN}`

  const res  = await fetch(url, { next: { revalidate: 0 } })
  const json = await res.json()

  if (json.error) throw new Error(json.error.message)

  const d = json.data?.[0]
  if (!d) return { spend: 0, impressions: 0, clicks: 0, reach: 0, cpm: 0, ctr: 0 }

  return {
    spend:       parseFloat(d.spend       || '0'),
    impressions: parseInt  (d.impressions || '0'),
    clicks:      parseInt  (d.clicks      || '0'),
    reach:       parseInt  (d.reach       || '0'),
    cpm:         parseFloat(d.cpm         || '0'),
    ctr:         parseFloat(d.ctr         || '0'),
  }
}

// GET /api/meta?date=YYYY-MM-DD&accountIds=act_111,act_222
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date       = searchParams.get('date')
  const accountIds = searchParams.get('accountIds')

  if (!date)  return NextResponse.json({ error: 'date requerida' }, { status: 400 })
  if (!TOKEN) return NextResponse.json({ error: 'META_ACCESS_TOKEN no configurado' }, { status: 500 })

  // Determinar qué cuentas consultar
  let ids: string[] = []
  if (accountIds) {
    ids = accountIds.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    const fallback = process.env.META_AD_ACCOUNT_ID
    if (!fallback) return NextResponse.json({ error: 'Sin cuentas configuradas' }, { status: 500 })
    ids = [fallback]
  }

  try {
    const results = await Promise.all(ids.map(id => fetchAccountInsights(id, date)))

    // Mapa por account_id
    const perAccount: Record<string, Insights> = {}
    ids.forEach((id, i) => { perAccount[id] = results[i] })

    // Totales agregados
    const totalSpend       = results.reduce((s, r) => s + r.spend,       0)
    const totalImpressions = results.reduce((s, r) => s + r.impressions,  0)
    const totalClicks      = results.reduce((s, r) => s + r.clicks,       0)
    const totalReach       = results.reduce((s, r) => s + r.reach,        0)

    const total: Insights = {
      spend:       totalSpend,
      impressions: totalImpressions,
      clicks:      totalClicks,
      reach:       totalReach,
      // CPM y CTR se recalculan del total (no se promedian)
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100  : 0,
    }

    return NextResponse.json({ total, perAccount })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al conectar con Meta'
    console.error('Meta API error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

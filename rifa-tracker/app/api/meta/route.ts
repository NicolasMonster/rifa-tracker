import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function fetchAccountInsights(accountId: string, date: string, campaignIds: string[]): Promise<Insights> {
  const fields = 'spend,impressions,clicks,reach,cpm,ctr'
  const range  = JSON.stringify({ since: date, until: date })
  let url = `${META_API}/${accountId}/insights?fields=${fields}&time_range=${range}&level=account&access_token=${TOKEN}`

  // Si hay campañas seleccionadas, filtramos por ellas
  if (campaignIds.length > 0) {
    const filtering = JSON.stringify([{
      field:    'campaign.id',
      operator: 'IN',
      value:    campaignIds,
    }])
    url = `${META_API}/${accountId}/insights?fields=${fields}&time_range=${range}&level=campaign&filtering=${encodeURIComponent(filtering)}&access_token=${TOKEN}`
  }

  const res  = await fetch(url, { next: { revalidate: 0 } })
  const json = await res.json()

  if (json.error) throw new Error(json.error.message)

  const data = campaignIds.length > 0
    // Sumar todos los datos de las campañas filtradas
    ? json.data || []
    : (json.data?.[0] ? [json.data[0]] : [])

  if (data.length === 0) return { spend: 0, impressions: 0, clicks: 0, reach: 0, cpm: 0, ctr: 0 }

  const totalSpend       = data.reduce((s: number, d: Record<string,string>) => s + parseFloat(d.spend || '0'), 0)
  const totalImpressions = data.reduce((s: number, d: Record<string,string>) => s + parseInt(d.impressions || '0'), 0)
  const totalClicks      = data.reduce((s: number, d: Record<string,string>) => s + parseInt(d.clicks || '0'), 0)
  const totalReach       = data.reduce((s: number, d: Record<string,string>) => s + parseInt(d.reach || '0'), 0)

  return {
    spend:       totalSpend,
    impressions: totalImpressions,
    clicks:      totalClicks,
    reach:       totalReach,
    cpm:  totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    ctr:  totalImpressions > 0 ? (totalClicks / totalImpressions) * 100  : 0,
  }
}

// GET /api/meta?date=YYYY-MM-DD&accountIds=act_111,act_222
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date       = searchParams.get('date')
  const accountIds = searchParams.get('accountIds')

  if (!date)  return NextResponse.json({ error: 'date requerida' }, { status: 400 })
  if (!TOKEN) return NextResponse.json({ error: 'META_ACCESS_TOKEN no configurado' }, { status: 500 })

  // Determinar cuentas
  let ids: string[] = []
  if (accountIds) {
    ids = accountIds.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    const fallback = process.env.META_AD_ACCOUNT_ID
    if (!fallback) return NextResponse.json({ error: 'Sin cuentas configuradas' }, { status: 500 })
    ids = [fallback]
  }

  // Obtener selected_campaign_ids de la DB para cada cuenta
  let campaignMap: Record<string, string[]> = {}
  try {
    const { data: accounts } = await db()
      .from('ad_accounts')
      .select('account_id, selected_campaign_ids')
      .in('account_id', ids)

    if (accounts) {
      accounts.forEach((a: { account_id: string; selected_campaign_ids: string }) => {
        try {
          campaignMap[a.account_id] = JSON.parse(a.selected_campaign_ids || '[]')
        } catch {
          campaignMap[a.account_id] = []
        }
      })
    }
  } catch {
    // Si falla la consulta DB, continuamos sin filtro de campañas
  }

  try {
    const results = await Promise.all(
      ids.map(id => fetchAccountInsights(id, date, campaignMap[id] || []))
    )

    const perAccount: Record<string, Insights> = {}
    ids.forEach((id, i) => { perAccount[id] = results[i] })

    const totalSpend       = results.reduce((s, r) => s + r.spend,       0)
    const totalImpressions = results.reduce((s, r) => s + r.impressions,  0)
    const totalClicks      = results.reduce((s, r) => s + r.clicks,       0)
    const totalReach       = results.reduce((s, r) => s + r.reach,        0)

    const total: Insights = {
      spend:       totalSpend,
      impressions: totalImpressions,
      clicks:      totalClicks,
      reach:       totalReach,
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

import { NextRequest, NextResponse } from 'next/server'

const META_API = 'https://graph.facebook.com/v19.0'
const ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID   // act_XXXXXXXXX
const TOKEN      = process.env.META_ACCESS_TOKEN

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!date) {
    return NextResponse.json({ error: 'date requerida' }, { status: 400 })
  }
  if (!TOKEN || !ACCOUNT_ID) {
    return NextResponse.json({ error: 'Variables de entorno META no configuradas' }, { status: 500 })
  }

  const fields = 'spend,impressions,clicks,reach,cpm,ctr'
  const url = `${META_API}/${ACCOUNT_ID}/insights?fields=${fields}&time_range={"since":"${date}","until":"${date}"}&level=account&access_token=${TOKEN}`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const json = await res.json()

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 400 })
    }

    const data = json.data?.[0]

    if (!data) {
      // Sin datos para esa fecha (posible que no haya habido ads activos)
      return NextResponse.json({
        spend: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        cpm: 0,
        ctr: 0,
      })
    }

    return NextResponse.json({
      spend:       parseFloat(data.spend       || '0'),
      impressions: parseInt(data.impressions   || '0'),
      clicks:      parseInt(data.clicks        || '0'),
      reach:       parseInt(data.reach         || '0'),
      cpm:         parseFloat(data.cpm         || '0'),
      ctr:         parseFloat(data.ctr         || '0'),
    })
  } catch (err) {
    console.error('Meta API error:', err)
    return NextResponse.json({ error: 'Error al conectar con Meta' }, { status: 500 })
  }
}

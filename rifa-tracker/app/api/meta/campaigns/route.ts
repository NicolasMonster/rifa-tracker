import { NextRequest, NextResponse } from 'next/server'

const META_API = 'https://graph.facebook.com/v19.0'
const TOKEN    = process.env.META_ACCESS_TOKEN

export type Campaign = {
  id: string
  name: string
  status: string
  effective_status: string
}

// GET /api/meta/campaigns?accountId=act_XXXXXXXXX
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) return NextResponse.json({ error: 'accountId requerido' }, { status: 400 })
  if (!TOKEN)     return NextResponse.json({ error: 'META_ACCESS_TOKEN no configurado' }, { status: 500 })

  const fields = 'id,name,status,effective_status'
  const url = `${META_API}/${accountId}/campaigns?fields=${fields}&limit=100&access_token=${TOKEN}`

  try {
    const res  = await fetch(url, { next: { revalidate: 0 } })
    const json = await res.json()

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 400 })
    }

    const campaigns: Campaign[] = (json.data || []).map((c: Campaign) => ({
      id:               c.id,
      name:             c.name,
      status:           c.status,
      effective_status: c.effective_status,
    }))

    return NextResponse.json(campaigns)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al conectar con Meta'
    console.error('Meta campaigns error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

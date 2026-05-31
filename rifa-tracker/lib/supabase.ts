import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type DailyEntry = {
  id: string
  date: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  generated: number
  rifas_sold: number
  clientes: number
  ticket_promedio: number
  notes: string | null
  created_at: string
  updated_at: string
  // Computed
  roas?: number
  net?: number
  cpa?: number
  ctr?: number
  cpm?: number
}

export type AdAccount = {
  id: string
  name: string
  account_id: string
  is_active: boolean
  color: string
  selected_campaign_ids: string   // JSON string: '["id1","id2"]'
  created_at: string
}

export type Campaign = {
  id: string
  name: string
  status: string
  effective_status: string
}

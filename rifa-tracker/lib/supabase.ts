import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
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
  rifas_sold: number        // legacy — mantenido para compatibilidad
  clientes: number          // reemplaza rifas_sold
  ticket_promedio: number
  notes: string | null
  created_at: string
  updated_at: string
  // Computed (no en DB)
  roas?: number
  net?: number
  cpa?: number
  ctr?: number
  cpm?: number
}

export type AdAccount = {
  id: string
  name: string
  account_id: string        // act_XXXXXXXXX
  is_active: boolean
  color: string
  created_at: string
}

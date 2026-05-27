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
  rifas_sold: number
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

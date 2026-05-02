import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. \n' +
    'Local: Check your .env.local file. \n' +
    'Production: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your deployment environment variables (e.g., Vercel Project Settings).'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Capture the landing URL before createClient() runs. The auth client consumes
// and strips recovery parameters during initialisation, but the application
// still needs to know how the visitor arrived in order to show the recovery
// form instead of routing the exchanged session to the normal dashboard.
export const initialUrlFragment = typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, '')
export const initialUrlQuery = typeof window === 'undefined' ? '' : window.location.search.replace(/^\?/, '')

/**
 * Parameters from the landing URL, fragment first. Supabase recovery links can
 * arrive either as an already-exchanged session (access_token with
 * type=recovery) or as an unconsumed token_hash that this app verifies itself.
 */
export const readInitialUrlParams = () => {
  const params = new URLSearchParams(initialUrlFragment)
  new URLSearchParams(initialUrlQuery).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value)
  })
  return params
}

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

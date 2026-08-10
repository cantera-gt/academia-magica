import { createBrowserClient } from "@supabase/ssr";

// Claves publicas (protegidas por Row Level Security en la base de datos,
// no son secretas por diseno de Supabase).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://wlxgvbabljflvhtxuzue.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_fdZJXhL5NTnabnbKIbmbrQ_K4HLxjUE";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

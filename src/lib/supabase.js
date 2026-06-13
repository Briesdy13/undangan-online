import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseReady = Boolean(url && anon && !anon.includes("PASTE_"));
export const supabase = isSupabaseReady
  ? createClient(url, anon, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

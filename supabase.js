let supabaseClient = null;

if (typeof window.supabase !== "undefined" && !CONFIG.USE_MOCK_DB) {
  supabaseClient = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
  );
}

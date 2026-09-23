// A chave publishable (ou anon) é pública por design. Nunca coloque a
// service_role key no navegador.
window.SABORE_SUPABASE_URL = "https://dzumxhfglusinxtyflwb.supabase.co";
window.SABORE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qKiOJEMNUGFZE-1UDmUXcg_WpxoyP5_";

if (!window.supabase || window.SABORE_SUPABASE_PUBLISHABLE_KEY.startsWith("COLE_")) {
    console.warn("Supabase Auth ainda não foi configurado. Consulte Front-End/assets/js/supabase-config.js.");
} else {
    window.supabaseClient = window.supabase.createClient(
        window.SABORE_SUPABASE_URL,
        window.SABORE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: true, detectSessionInUrl: true } }
    );
}

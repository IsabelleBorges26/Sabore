// A chave publishable (ou anon) é pública por design. Nunca coloque a
// service_role key no navegador.
window.SABORE_SUPABASE_URL = "https://dzumxhfglusinxtyflwb.supabase.co";
window.SABORE_SUPABASE_CONFIG_ERROR = "";
window.SABORE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qKiOJEMNUGFZE-1UDmUXcg_WpxoyP5_";

if (!window.supabase || window.SABORE_SUPABASE_PUBLISHABLE_KEY.startsWith("COLE_")) {
    console.warn("Supabase Auth ainda não foi configurado. Consulte Front-End/assets/js/supabase-config.js.");
} else {
    try {
        window.supabaseClient = window.supabase.createClient(
            window.SABORE_SUPABASE_URL,
            window.SABORE_SUPABASE_PUBLISHABLE_KEY,
            { auth: { persistSession: true, detectSessionInUrl: true } }
        );
    } catch (error) {
        window.SABORE_SUPABASE_CONFIG_ERROR = "Não foi possível iniciar o Supabase Auth. Confira a URL e a chave publicável do projeto.";
        console.error(window.SABORE_SUPABASE_CONFIG_ERROR, error);
    }
}

if (!window.supabaseClient) {
    if (!window.SABORE_SUPABASE_PUBLISHABLE_KEY || window.SABORE_SUPABASE_PUBLISHABLE_KEY.startsWith("COLE_")) {
        window.SABORE_SUPABASE_CONFIG_ERROR = "A chave publicável do Supabase não foi configurada.";
    } else if (!window.supabase || typeof window.supabase.createClient !== "function") {
        window.SABORE_SUPABASE_CONFIG_ERROR = "A biblioteca do Supabase não carregou. Verifique a conexão e atualize a página.";
    } else {
        window.SABORE_SUPABASE_CONFIG_ERROR = "Não foi possível iniciar o Supabase Auth. Confira a URL e a chave publicável do projeto.";
    }
    console.error(window.SABORE_SUPABASE_CONFIG_ERROR);
}

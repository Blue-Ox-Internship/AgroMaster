const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey && !String(supabaseAnonKey).includes('replace_with')) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

const exportedClient = supabase || {};
exportedClient.supabaseUrl = supabaseUrl;
exportedClient.supabaseAnonKey = supabaseAnonKey;
exportedClient.supabaseServiceRoleKey = supabaseServiceRoleKey;

module.exports = exportedClient;

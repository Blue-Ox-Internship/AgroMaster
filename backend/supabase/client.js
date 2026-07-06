const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

const isPlaceholderValue = (value) => typeof value === 'string' && (value.includes('replace_with') || value.includes('your_supabase') || value.includes('your_anon') || value.includes('your_service'));

const isValidHttpUrl = (value) => {
    if (!value || typeof value !== 'string') return false;

    try {
        const parsedUrl = new URL(value);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

let supabase = null;

if (supabaseUrl && supabaseKey && !isPlaceholderValue(supabaseKey) && isValidHttpUrl(supabaseUrl)) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
    } catch (error) {
        console.warn('Supabase client initialization skipped:', error.message);
    }
}

const exportedClient = supabase || {};
exportedClient.supabaseUrl = supabaseUrl;
exportedClient.supabaseAnonKey = supabaseAnonKey;
exportedClient.supabaseServiceRoleKey = supabaseServiceRoleKey;
exportedClient.isConfigured = Boolean(supabase && supabaseUrl && supabaseKey && !isPlaceholderValue(supabaseKey) && isValidHttpUrl(supabaseUrl));

module.exports = exportedClient;

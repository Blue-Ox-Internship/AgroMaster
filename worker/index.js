const JSON_HEADERS = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*'
};

function json(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: JSON_HEADERS
    });
}

async function supabaseRequest(env, path, init = {}) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        return {
            response: null,
            data: null,
            error: 'Supabase env vars are not configured yet.'
        };
    }

    const url = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1${path}`;
    const headers = {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation',
        ...(init.headers || {})
    };

    const response = await fetch(url, {
        ...init,
        headers
    });

    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    return { response, data, error: null };
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/health') {
            return json(200, {
                status: 'ok',
                service: env.WORKER_NAME || 'agrodrop',
                supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
                timestamp: new Date().toISOString()
            });
        }

        if (url.pathname === '/api/medicines') {
            if (request.method === 'GET') {
                const { response, data, error } = await supabaseRequest(env, '/medicines?select=*');
                if (error) {
                    return json(500, { error });
                }
                return json(response.status, data ?? []);
            }

            if (request.method === 'POST') {
                const payload = await request.json().catch(() => ({}));
                const { response, data, error } = await supabaseRequest(env, '/medicines', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if (error) {
                    return json(500, { error });
                }

                return json(response.status, data ?? []);
            }
        }

        return json(404, {
            message: 'AgroDrop worker is live. Configure Supabase env vars and apply the SQL schema to use the database-backed routes.'
        });
    }
};

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', service: env.WORKER_NAME || 'agrodrop', supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY) }), {
            status: 200,
            headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });
    }

    if (url.pathname === '/api/auth/login' && method === 'POST') {
        const payload = await request.json().catch(() => ({}));
        const email = String(payload.email || '').trim().toLowerCase();
        const password = String(payload.password || '');

        if (!email || !password) {
            return new Response(JSON.stringify({ status: 'error', message: 'Email and password are required.' }), {
                status: 400,
                headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
            });
        }

        const supabaseUrl = env.SUPABASE_URL || 'https://wxyzfbxptmrobtkvrzky.supabase.co';
        const anonKey = env.SUPABASE_ANON_KEY || 'replace_with_supabase_anon_key';

        const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,full_name,email,phone,business_name,role,is_active,password_hash`, {
            method: 'GET',
            headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                Accept: 'application/json'
            }
        });

        const data = await response.json().catch(() => []);
        const user = Array.isArray(data) ? data[0] : data;

        if (!user || (user.password_hash || user.password || '') !== password) {
            return new Response(JSON.stringify({ status: 'error', message: 'Invalid email or password.' }), {
                status: 401,
                headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
            });
        }

        return new Response(JSON.stringify({
            status: 'success',
            message: 'Login successful',
            token: `demo-${user.id}`,
            user: {
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                business_name: user.business_name,
                role: user.role
            }
        }), {
            status: 200,
            headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });
    }

    if (url.pathname === '/api/auth/register' && method === 'POST') {
        const payload = await request.json().catch(() => ({}));
        const supabaseUrl = env.SUPABASE_URL || 'https://wxyzfbxptmrobtkvrzky.supabase.co';
        const anonKey = env.SUPABASE_ANON_KEY || 'replace_with_supabase_anon_key';

        const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/users`, {
            method: 'POST',
            headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            },
            body: JSON.stringify({
                full_name: payload.full_name,
                email: String(payload.email || '').trim().toLowerCase(),
                phone: payload.phone || null,
                business_name: payload.business_name || null,
                password_hash: String(payload.password || ''),
                role: payload.role || 'Sales Attendant',
                is_active: true
            })
        });

        const data = await response.json().catch(() => []);
        const createdUser = Array.isArray(data) ? data[0] : data;

        return new Response(JSON.stringify({
            status: response.ok ? 'success' : 'error',
            message: response.ok ? 'User registered successfully' : 'Unable to create account',
            user: createdUser ? {
                user_id: createdUser.id,
                full_name: createdUser.full_name,
                email: createdUser.email,
                role: createdUser.role
            } : null
        }), {
            status: response.ok ? 201 : 500,
            headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
        });
    }

    const supabaseUrl = env.SUPABASE_URL || 'https://wxyzfbxptmrobtkvrzky.supabase.co';
    const anonKey = env.SUPABASE_ANON_KEY || 'replace_with_supabase_anon_key';
    const path = url.pathname.replace(/^\/api\//, '/');
    const target = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1${path}${url.search}`);

    const headers = new Headers(request.headers);
    headers.set('apikey', anonKey);
    headers.set('Authorization', `Bearer ${anonKey}`);
    headers.set('Prefer', 'return=representation');

    const response = await fetch(target, { method, headers, body: method === 'GET' || method === 'HEAD' ? undefined : request.body });
    const text = await response.text();

    return new Response(text, {
        status: response.status,
        headers: {
            'content-type': response.headers.get('content-type') || 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        }
    });
}

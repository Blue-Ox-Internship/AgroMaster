const JSON_HEADERS = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization'
};

const DEMO_USERS = [
    {
        user_id: 'usr_admin',
        full_name: 'Dr. Sarah Nakato',
        business_name: 'AgroDrop Uganda Ltd',
        email: 'admin@agrodrop.com',
        phone: '+256 700 123456',
        password: 'admin123',
        role: 'Administrator'
    },
    {
        user_id: 'usr_manager',
        full_name: 'John Ssebunya',
        business_name: 'AgroDrop Uganda Ltd',
        email: 'manager@agrodrop.com',
        phone: '+256 701 234567',
        password: 'manager123',
        role: 'Store Manager'
    },
    {
        user_id: 'usr_sales',
        full_name: 'Grace Apio',
        business_name: 'AgroDrop Uganda Ltd',
        email: 'sales@agrodrop.com',
        phone: '+256 702 345678',
        password: 'sales123',
        role: 'Sales Attendant'
    }
];

const state = {
    users: DEMO_USERS.map((user) => ({ ...user })),
    medicines: [
        {
            medicine_id: 'med_001',
            medicine_name: 'Oxytetracycline 20%',
            category: 'Antibiotic',
            manufacturer: 'Norbrook',
            batch_number: 'BT2024001',
            expiry_date: '2026-12-31',
            quantity: 45,
            unit_price: 35000,
            description: 'Broad-spectrum antibiotic for livestock',
            created_at: '2024-01-10T08:00:00.000Z',
            updated_at: '2024-01-10T08:00:00.000Z'
        },
        {
            medicine_id: 'med_002',
            medicine_name: 'Albendazole 2.5%',
            category: 'Antiparasitic',
            manufacturer: 'Elanco',
            batch_number: 'BT2024002',
            expiry_date: '2026-10-15',
            quantity: 7,
            unit_price: 18000,
            description: 'Dewormer for internal parasites',
            created_at: '2024-01-12T08:00:00.000Z',
            updated_at: '2024-01-12T08:00:00.000Z'
        }
    ],
    suppliers: [
        {
            supplier_id: 'sup_001',
            supplier_name: 'Norbrook Uganda Ltd',
            phone: '+256 414 123456',
            email: 'orders@norbrook.ug',
            address: 'Plot 45, Kampala Industrial Area',
            contact_person: 'Jane Ayesiga',
            payment_terms: 'Net 30',
            is_active: true,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z'
        }
    ],
    purchases: [],
    sales: [],
    alerts: []
};

function json(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: JSON_HEADERS
    });
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeUser(user) {
    return {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        business_name: user.business_name,
        role: user.role
    };
}

function getUserFromRequest(request) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return null;

    const user = state.users.find((item) => item.user_id === token || item.email === token);
    return user || null;
}

function parseJsonBody(request) {
    return request.json().catch(() => ({}));
}

function getCollection(collectionName) {
    return clone(state[collectionName] || []);
}

function createCollectionItem(collectionName, payload) {
    const collection = state[collectionName] || [];
    const idKey = collectionName === 'users' ? 'user_id' : collectionName === 'medicines' ? 'medicine_id' : collectionName === 'suppliers' ? 'supplier_id' : collectionName === 'purchases' ? 'purchase_id' : collectionName === 'sales' ? 'sale_id' : 'alert_id';
    const item = { ...payload };
    item[idKey] = item[idKey] || createId(collectionName === 'users' ? 'usr' : collectionName === 'medicines' ? 'med' : collectionName === 'suppliers' ? 'sup' : collectionName === 'purchases' ? 'pur' : collectionName === 'sales' ? 'sal' : 'alt');
    item.created_at = item.created_at || new Date().toISOString();
    item.updated_at = item.updated_at || item.created_at;
    collection.push(item);
    state[collectionName] = collection;
    return clone(item);
}

function getDashboardStats() {
    const medicines = getCollection('medicines');
    const suppliers = getCollection('suppliers');
    const sales = getCollection('sales');
    const alerts = getCollection('alerts');
    const totalStock = medicines.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const lowStock = medicines.filter((item) => Number(item.quantity || 0) <= 10).length;
    const totalSales = sales.reduce((sum, item) => sum + Number(item.total_amount || item.amount || 0), 0);
    return {
        total_medicines: medicines.length,
        total_stock: totalStock,
        low_stock_items: lowStock,
        total_suppliers: suppliers.length,
        total_sales: totalSales,
        pending_alerts: alerts.filter((alert) => alert.status !== 'read').length
    };
}

function handleCollection(request, collectionName) {
    if (request.method === 'GET') {
        return json(200, {
            status: 'success',
            [collectionName]: getCollection(collectionName)
        });
    }

    if (request.method === 'POST') {
        return parseJsonBody(request).then((payload) => {
            const item = createCollectionItem(collectionName, payload);
            return json(201, {
                status: 'success',
                message: 'Created successfully',
                [collectionName.slice(0, -1)]: item
            });
        });
    }

    return json(405, { status: 'error', message: 'Method not allowed' });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: JSON_HEADERS });
        }

        const url = new URL(request.url);

        if (url.pathname === '/api/health') {
            return json(200, {
                status: 'ok',
                service: env.WORKER_NAME || 'agrodrop',
                timestamp: new Date().toISOString()
            });
        }

        if (url.pathname === '/api/auth/login') {
            if (request.method !== 'POST') {
                return json(405, { status: 'error', message: 'Method not allowed' });
            }

            const payload = await parseJsonBody(request);
            const email = String(payload.email || '').trim().toLowerCase();
            const password = String(payload.password || '').trim();
            const user = state.users.find((item) => item.email.toLowerCase() === email && item.password === password);

            if (!user) {
                return json(401, { status: 'error', message: 'Invalid email or password' });
            }

            return json(200, {
                status: 'success',
                message: 'Login successful',
                token: user.user_id,
                user: sanitizeUser(user)
            });
        }

        if (url.pathname === '/api/auth/register') {
            if (request.method !== 'POST') {
                return json(405, { status: 'error', message: 'Method not allowed' });
            }

            const payload = await parseJsonBody(request);
            const existing = state.users.find((user) => user.email.toLowerCase() === String(payload.email || '').toLowerCase());
            if (existing) {
                return json(409, { status: 'error', message: 'Email already registered' });
            }

            const newUser = createCollectionItem('users', {
                full_name: payload.full_name,
                email: String(payload.email || '').trim().toLowerCase(),
                phone: payload.phone,
                business_name: payload.business_name,
                password: payload.password,
                role: payload.role || 'Sales Attendant'
            });

            return json(201, {
                status: 'success',
                message: 'User registered successfully',
                token: newUser.user_id,
                user: sanitizeUser(newUser)
            });
        }

        if (url.pathname === '/api/auth/me') {
            const currentUser = getUserFromRequest(request);
            if (!currentUser) {
                return json(401, { status: 'error', message: 'Unauthorized' });
            }
            return json(200, { status: 'success', user: sanitizeUser(currentUser) });
        }

        if (url.pathname === '/api/users') {
            return handleCollection(request, 'users');
        }

        if (url.pathname === '/api/medicines') {
            return handleCollection(request, 'medicines');
        }

        if (url.pathname === '/api/suppliers') {
            return handleCollection(request, 'suppliers');
        }

        if (url.pathname === '/api/purchases') {
            return handleCollection(request, 'purchases');
        }

        if (url.pathname === '/api/sales') {
            return handleCollection(request, 'sales');
        }

        if (url.pathname === '/api/alerts') {
            return handleCollection(request, 'alerts');
        }

        if (url.pathname === '/api/reports/dashboard/stats') {
            return json(200, { status: 'success', stats: getDashboardStats() });
        }

        if (url.pathname === '/api/reports/stock') {
            return json(200, { status: 'success', medicines: getCollection('medicines') });
        }

        if (url.pathname === '/api/reports/sales') {
            return json(200, { status: 'success', sales: getCollection('sales') });
        }

        if (url.pathname === '/api/reports/expiry') {
            return json(200, { status: 'success', medicines: getCollection('medicines') });
        }

        if (url.pathname === '/api/reports/suppliers') {
            return json(200, { status: 'success', suppliers: getCollection('suppliers') });
        }

        return json(404, {
            status: 'error',
            message: 'AgroDrop worker is live and ready for public access.'
        });
    }
};

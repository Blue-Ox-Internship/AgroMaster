process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.CORS_ORIGIN = '*';

const express = require('express');
const jwt = require('jsonwebtoken');

const testApp = express();
testApp.locals.dbConnected = false;
testApp.locals.supabaseConnected = false;

testApp.use(express.json({ limit: '10mb' }));
testApp.use(express.urlencoded({ limit: '10mb', extended: true }));

testApp.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

testApp.use('/api/auth', require('../routes/auth.routes'));
testApp.use('/api/users', require('../routes/users.routes'));
testApp.use('/api/medicines', require('../routes/medicines.routes'));
testApp.use('/api/suppliers', require('../routes/suppliers.routes'));
testApp.use('/api/purchases', require('../routes/purchases.routes'));
testApp.use('/api/sales', require('../routes/sales.routes'));
testApp.use('/api/alerts', require('../routes/alerts.routes'));
testApp.use('/api/reports', require('../routes/reports.routes'));

testApp.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'AgroMaster API is running',
        timestamp: new Date().toISOString(),
        environment: 'test',
        supabaseConfigured: false,
        mongodbConfigured: false
    });
});

testApp.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

testApp.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        path: req.path
    });
});

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

function getAdminToken() {
    return jwt.sign(
        { user_id: 'usr_admin', email: 'admin@agrodrop.com', role: 'Administrator' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function getManagerToken() {
    return jwt.sign(
        { user_id: 'usr_manager', email: 'manager@agrodrop.com', role: 'Store Manager' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function getSalesToken() {
    return jwt.sign(
        { user_id: 'usr_sales', email: 'sales@agrodrop.com', role: 'Sales Attendant' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

const { state } = require('../config/fallback-store');

function resetState() {
    const demoUsers = require('../config/demo-users');
    state.users = demoUsers.map((user) => ({ ...user }));
    state.medicines = [
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
    ];
    state.suppliers = [
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
    ];
    state.purchases = [];
    state.sales = [];
    state.alerts = [];
}

module.exports = {
    testApp,
    getAdminToken,
    getManagerToken,
    getSalesToken,
    resetState
};

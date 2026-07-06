const request = require('supertest');
const { testApp, getAdminToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Reports Routes', () => {
    describe('GET /api/reports/stock', () => {
        it('should return stock report', async () => {
            const res = await request(testApp)
                .get('/api/reports/stock')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.summary).toBeDefined();
            expect(res.body.summary.totalMedicines).toBe(2);
            expect(res.body.summary.lowStockItems).toBe(1);
            expect(typeof res.body.summary.totalValue).toBe('number');
            expect(Array.isArray(res.body.medicines)).toBe(true);
        });
    });

    describe('GET /api/reports/sales', () => {
        it('should return sales report', async () => {
            const res = await request(testApp)
                .get('/api/reports/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.summary).toBeDefined();
            expect(typeof res.body.summary.transactions).toBe('number');
            expect(typeof res.body.summary.totalRevenue).toBe('number');
        });

        it('should accept date range parameters', async () => {
            const res = await request(testApp)
                .get('/api/reports/sales?from=2024-01-01&to=2024-12-31')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should reject invalid from date', async () => {
            const res = await request(testApp)
                .get('/api/reports/sales?from=invalid-date')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/reports/expiry', () => {
        it('should return expiry report', async () => {
            const res = await request(testApp)
                .get('/api/reports/expiry')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.summary).toBeDefined();
            expect(typeof res.body.summary.expired).toBe('number');
            expect(typeof res.body.summary.expiringSoon).toBe('number');
            expect(typeof res.body.summary.valid).toBe('number');
        });
    });

    describe('GET /api/reports/suppliers', () => {
        it('should return supplier report', async () => {
            const res = await request(testApp)
                .get('/api/reports/suppliers')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.summary).toBeDefined();
            expect(res.body.summary.totalSuppliers).toBe(1);
            expect(Array.isArray(res.body.suppliers)).toBe(true);
        });
    });

    describe('GET /api/reports/dashboard/stats', () => {
        it('should return dashboard stats', async () => {
            const res = await request(testApp)
                .get('/api/reports/dashboard/stats')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.stats).toBeDefined();
            expect(typeof res.body.stats.totalMedicines).toBe('number');
            expect(typeof res.body.stats.lowStockItems).toBe('number');
        });
    });
});

const request = require('supertest');
const { testApp, getAdminToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Sales Routes', () => {
    const validSalePayload = {
        medicine_id: 'med_001',
        quantity: 5,
        selling_price: 35000,
        sale_date: '2024-06-23',
        customer_name: 'Test Customer',
        payment_method: 'Cash'
    };

    describe('GET /api/sales', () => {
        it('should return all sales', async () => {
            const res = await request(testApp)
                .get('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.sales)).toBe(true);
        });
    });

    describe('POST /api/sales', () => {
        it('should create a new sale', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send(validSalePayload);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.sale.quantity).toBe(5);
            expect(res.body.sale.total_amount).toBe(175000);
        });

        it('should deduct stock on sale', async () => {
            await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send(validSalePayload);

            const medRes = await request(testApp)
                .get('/api/medicines/med_001')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(medRes.body.medicine.quantity).toBe(40);
        });

        it('should reject sale exceeding available stock', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    medicine_id: 'med_001',
                    quantity: 999,
                    selling_price: 35000
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should reject missing medicine_id', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ quantity: 5, selling_price: 35000 });

            expect(res.status).toBe(400);
        });

        it('should reject missing quantity', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ medicine_id: 'med_001', selling_price: 35000 });

            expect(res.status).toBe(400);
        });

        it('should reject missing selling_price', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ medicine_id: 'med_001', quantity: 5 });

            expect(res.status).toBe(400);
        });

        it('should reject zero quantity', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ medicine_id: 'med_001', quantity: 0, selling_price: 35000 });

            expect(res.status).toBe(400);
        });

        it('should reject non-existent medicine', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ medicine_id: 'nonexistent', quantity: 5, selling_price: 35000 });

            expect(res.status).toBe(404);
        });

        it('should reject invalid payment method', async () => {
            const res = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    medicine_id: 'med_001',
                    quantity: 5,
                    selling_price: 35000,
                    payment_method: 'Invalid'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/sales/:id', () => {
        it('should return 404 for non-existent sale', async () => {
            const res = await request(testApp)
                .get('/api/sales/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/sales/:id', () => {
        it('should delete a sale after creating it', async () => {
            const createRes = await request(testApp)
                .post('/api/sales')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send(validSalePayload);

            const saleId = createRes.body.sale.sale_id;

            const delRes = await request(testApp)
                .delete(`/api/sales/${saleId}`)
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(delRes.status).toBe(200);
        });
    });

    describe('GET /api/sales/stats/daily', () => {
        it('should return daily stats', async () => {
            const res = await request(testApp)
                .get('/api/sales/stats/daily')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.stats).toBeDefined();
            expect(typeof res.body.stats.todayTransactions).toBe('number');
        });
    });
});

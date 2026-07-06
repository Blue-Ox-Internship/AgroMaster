const request = require('supertest');
const { testApp, getAdminToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Purchases Routes', () => {
    const validPurchasePayload = {
        supplier_id: 'sup_001',
        medicine_id: 'med_001',
        quantity: 20,
        buying_price: 28000,
        purchase_date: '2024-06-23',
        invoice_number: 'INV-001',
        notes: 'Test purchase'
    };

    describe('GET /api/purchases', () => {
        it('should return all purchases', async () => {
            const res = await request(testApp)
                .get('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.purchases)).toBe(true);
        });
    });

    describe('POST /api/purchases', () => {
        it('should create a new purchase', async () => {
            const res = await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send(validPurchasePayload);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.purchase.quantity).toBe(20);
            expect(res.body.purchase.total_cost).toBe(560000);
        });

        it('should increase stock on purchase', async () => {
            await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send(validPurchasePayload);

            const medRes = await request(testApp)
                .get('/api/medicines/med_001')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(medRes.body.medicine.quantity).toBe(65);
        });

        it('should reject missing supplier_id', async () => {
            const res = await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ medicine_id: 'med_001', quantity: 10, buying_price: 100 });

            expect(res.status).toBe(400);
        });

        it('should reject missing medicine_id', async () => {
            const res = await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ supplier_id: 'sup_001', quantity: 10, buying_price: 100 });

            expect(res.status).toBe(400);
        });

        it('should reject missing quantity', async () => {
            const res = await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ supplier_id: 'sup_001', medicine_id: 'med_001', buying_price: 100 });

            expect(res.status).toBe(400);
        });

        it('should reject zero quantity', async () => {
            const res = await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    supplier_id: 'sup_001',
                    medicine_id: 'med_001',
                    quantity: 0,
                    buying_price: 100
                });

            expect(res.status).toBe(400);
        });

        it('should reject missing buying_price', async () => {
            const res = await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ supplier_id: 'sup_001', medicine_id: 'med_001', quantity: 10 });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/purchases/:id', () => {
        it('should return 404 for non-existent purchase', async () => {
            const res = await request(testApp)
                .get('/api/purchases/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/purchases/:id', () => {
        it('should delete a purchase after creating it', async () => {
            const createRes = await request(testApp)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send(validPurchasePayload);

            const purchaseId = createRes.body.purchase.purchase_id;

            const delRes = await request(testApp)
                .delete(`/api/purchases/${purchaseId}`)
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(delRes.status).toBe(200);
        });
    });
});

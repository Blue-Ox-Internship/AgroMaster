const request = require('supertest');
const { testApp, getAdminToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Suppliers Routes', () => {
    describe('GET /api/suppliers', () => {
        it('should return all active suppliers', async () => {
            const res = await request(testApp)
                .get('/api/suppliers')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.suppliers)).toBe(true);
            expect(res.body.suppliers.length).toBe(1);
        });

        it('should search suppliers', async () => {
            const res = await request(testApp)
                .get('/api/suppliers?search=Norbrook')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.suppliers.length).toBe(1);
        });
    });

    describe('GET /api/suppliers/:id', () => {
        it('should return a supplier by ID', async () => {
            const res = await request(testApp)
                .get('/api/suppliers/sup_001')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.supplier.supplier_name).toBe('Norbrook Uganda Ltd');
        });

        it('should return 404 for non-existent supplier', async () => {
            const res = await request(testApp)
                .get('/api/suppliers/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/suppliers', () => {
        it('should create a new supplier', async () => {
            const res = await request(testApp)
                .post('/api/suppliers')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    supplier_name: 'Test Supplier',
                    phone: '+256 700 000000',
                    email: 'test@supplier.com',
                    address: 'Test Address',
                    contact_person: 'John Doe',
                    payment_terms: 'Net 30'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.supplier.supplier_name).toBe('Test Supplier');
        });

        it('should reject missing supplier name', async () => {
            const res = await request(testApp)
                .post('/api/suppliers')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ phone: '+256 700 000000' });

            expect(res.status).toBe(400);
        });

        it('should reject missing phone', async () => {
            const res = await request(testApp)
                .post('/api/suppliers')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ supplier_name: 'No Phone' });

            expect(res.status).toBe(400);
        });

        it('should reject invalid email format', async () => {
            const res = await request(testApp)
                .post('/api/suppliers')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    supplier_name: 'Bad Email',
                    phone: '+256 700 000000',
                    email: 'not-an-email'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/suppliers/:id', () => {
        it('should update an existing supplier', async () => {
            const res = await request(testApp)
                .put('/api/suppliers/sup_001')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ supplier_name: 'Updated Supplier', phone: '+256 700 111111' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.supplier.supplier_name).toBe('Updated Supplier');
        });

        it('should return 404 for non-existent supplier', async () => {
            const res = await request(testApp)
                .put('/api/suppliers/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ supplier_name: 'No Exists', phone: '+256 700 000000' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/suppliers/:id', () => {
        it('should soft-delete a supplier', async () => {
            const res = await request(testApp)
                .delete('/api/suppliers/sup_001')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');

            const getRes = await request(testApp)
                .get('/api/suppliers')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(getRes.body.suppliers.length).toBe(0);
        });
    });
});

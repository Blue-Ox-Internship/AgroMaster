const request = require('supertest');
const { testApp, getAdminToken, getSalesToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Medicines Routes', () => {
    describe('GET /api/medicines', () => {
        it('should return all medicines', async () => {
            const res = await request(testApp)
                .get('/api/medicines')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.medicines)).toBe(true);
            expect(res.body.medicines.length).toBe(2);
        });

        it('should filter by category', async () => {
            const res = await request(testApp)
                .get('/api/medicines?category=Antibiotic')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.medicines.length).toBe(1);
            expect(res.body.medicines[0].category).toBe('Antibiotic');
        });

        it('should search medicines', async () => {
            const res = await request(testApp)
                .get('/api/medicines?search=Oxytetracycline')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.medicines.length).toBe(1);
        });

        it('should allow without auth (soft auth)', async () => {
            const res = await request(testApp).get('/api/medicines');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/medicines/:id', () => {
        it('should return a medicine by ID', async () => {
            const res = await request(testApp)
                .get('/api/medicines/med_001')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.medicine.medicine_name).toBe('Oxytetracycline 20%');
        });

        it('should return 404 for non-existent medicine', async () => {
            const res = await request(testApp)
                .get('/api/medicines/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/medicines', () => {
        it('should create a new medicine', async () => {
            const res = await request(testApp)
                .post('/api/medicines')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    medicine_name: 'Test Medicine',
                    category: 'Antibiotic',
                    expiry_date: '2026-12-31',
                    quantity: 100,
                    unit_price: 25000,
                    manufacturer: 'Test Corp',
                    batch_number: 'BT-TEST-001',
                    description: 'Test description'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.medicine.medicine_name).toBe('Test Medicine');
        });

        it('should reject missing required fields', async () => {
            const res = await request(testApp)
                .post('/api/medicines')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ medicine_name: 'Incomplete' });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should reject invalid category', async () => {
            const res = await request(testApp)
                .post('/api/medicines')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    medicine_name: 'Bad Category',
                    category: 'InvalidCategory',
                    expiry_date: '2026-12-31',
                    quantity: 10,
                    unit_price: 100
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should reject negative quantity', async () => {
            const res = await request(testApp)
                .post('/api/medicines')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    medicine_name: 'Negative Qty',
                    category: 'Antibiotic',
                    expiry_date: '2026-12-31',
                    quantity: -5,
                    unit_price: 100
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should reject non-numeric price', async () => {
            const res = await request(testApp)
                .post('/api/medicines')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    medicine_name: 'Bad Price',
                    category: 'Antibiotic',
                    expiry_date: '2026-12-31',
                    quantity: 10,
                    unit_price: -100
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should allow any authenticated role to create', async () => {
            const res = await request(testApp)
                .post('/api/medicines')
                .set('Authorization', `Bearer ${getSalesToken()}`)
                .send({
                    medicine_name: 'Sales Creates',
                    category: 'Supplement',
                    expiry_date: '2027-01-01',
                    quantity: 50,
                    unit_price: 15000
                });

            expect(res.status).toBe(201);
        });
    });

    describe('PUT /api/medicines/:id', () => {
        it('should update an existing medicine', async () => {
            const res = await request(testApp)
                .put('/api/medicines/med_001')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ quantity: 100, unit_price: 40000 });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.medicine.quantity).toBe(100);
        });

        it('should return 404 for non-existent medicine', async () => {
            const res = await request(testApp)
                .put('/api/medicines/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ quantity: 10 });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/medicines/:id', () => {
        it('should delete an existing medicine', async () => {
            const res = await request(testApp)
                .delete('/api/medicines/med_001')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should return 404 for non-existent medicine', async () => {
            const res = await request(testApp)
                .delete('/api/medicines/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });
});

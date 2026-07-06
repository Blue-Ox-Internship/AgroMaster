const request = require('supertest');
const { testApp, getAdminToken, getSalesToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Users Routes', () => {
    describe('GET /api/users', () => {
        it('should return all users for admin', async () => {
            const res = await request(testApp)
                .get('/api/users')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.users)).toBe(true);
        });

        it('should reject non-admin users', async () => {
            const res = await request(testApp)
                .get('/api/users')
                .set('Authorization', `Bearer ${getSalesToken()}`);

            expect(res.status).toBe(403);
        });

        it('should reject without auth', async () => {
            const res = await request(testApp).get('/api/users');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user for admin', async () => {
            const res = await request(testApp)
                .post('/api/users')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    full_name: 'New User',
                    email: 'newuser@test.com',
                    password: 'password123',
                    role: 'Sales Attendant'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.user.email).toBe('newuser@test.com');
        });

        it('should reject non-admin users', async () => {
            const res = await request(testApp)
                .post('/api/users')
                .set('Authorization', `Bearer ${getSalesToken()}`)
                .send({
                    full_name: 'Should Fail',
                    email: 'fail@test.com',
                    password: 'password123'
                });

            expect(res.status).toBe(403);
        });

        it('should reject duplicate email', async () => {
            const res = await request(testApp)
                .post('/api/users')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    full_name: 'Duplicate',
                    email: 'admin@agrodrop.com',
                    password: 'password123'
                });

            expect(res.status).toBe(409);
        });

        it('should reject missing required fields', async () => {
            const res = await request(testApp)
                .post('/api/users')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ email: 'test@test.com' });

            expect(res.status).toBe(400);
        });

        it('should reject short password', async () => {
            const res = await request(testApp)
                .post('/api/users')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    full_name: 'Test',
                    email: 'test@test.com',
                    password: '12345'
                });

            expect(res.status).toBe(400);
        });

        it('should reject invalid email format', async () => {
            const res = await request(testApp)
                .post('/api/users')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    full_name: 'Test',
                    email: 'not-email',
                    password: 'password123'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update a user', async () => {
            const res = await request(testApp)
                .put('/api/users/usr_admin')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ full_name: 'Updated Admin' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.user.full_name).toBe('Updated Admin');
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(testApp)
                .put('/api/users/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({ full_name: 'No Exists' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete a user as admin', async () => {
            const createRes = await request(testApp)
                .post('/api/users')
                .set('Authorization', `Bearer ${getAdminToken()}`)
                .send({
                    full_name: 'Delete Me',
                    email: 'deleteme@test.com',
                    password: 'password123'
                });

            const userId = createRes.body.user.user_id;

            const delRes = await request(testApp)
                .delete(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(delRes.status).toBe(200);
        });

        it('should reject non-admin from deleting', async () => {
            const res = await request(testApp)
                .delete('/api/users/usr_admin')
                .set('Authorization', `Bearer ${getSalesToken()}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should get a user by ID', async () => {
            const res = await request(testApp)
                .get('/api/users/usr_admin')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.user.email).toBe('admin@agrodrop.com');
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(testApp)
                .get('/api/users/nonexistent')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });
});

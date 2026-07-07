const request = require('supertest');
const { testApp, getAdminToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Auth Routes', () => {
    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'admin@agrodrop.com', password: 'admin123' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('admin@agrodrop.com');
            expect(res.body.user.role).toBe('Administrator');
        });

        it('should login with manager credentials', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'manager@agrodrop.com', password: 'manager123' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.user.role).toBe('Store Manager');
        });

        it('should login with sales credentials', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'sales@agrodrop.com', password: 'sales123' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.user.role).toBe('Sales Attendant');
        });

        it('should reject invalid password', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'admin@agrodrop.com', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('Invalid email or password');
        });

        it('should reject invalid email', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@test.com', password: 'somepass' });

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
        });

        it('should reject missing email', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ password: 'admin123' });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should reject missing password', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'admin@agrodrop.com' });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should reject invalid email format', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'not-an-email', password: 'admin123' });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should login case-insensitively with email', async () => {
            const res = await request(testApp)
                .post('/api/auth/login')
                .send({ email: 'ADMIN@AGRODROP.COM', password: 'admin123' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(testApp)
                .post('/api/auth/register')
                .send({
                    full_name: 'Test User',
                    email: 'test@example.com',
                    password: 'testpass123',
                    role: 'Sales Attendant'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should reject duplicate email', async () => {
            const res = await request(testApp)
                .post('/api/auth/register')
                .send({
                    full_name: 'Duplicate',
                    email: 'admin@agrodrop.com',
                    password: 'testpass123'
                });

            expect(res.status).toBe(409);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toMatch(/email/i);
        });

        it('should reject missing full_name', async () => {
            const res = await request(testApp)
                .post('/api/auth/register')
                .send({ email: 'test@test.com', password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });

        it('should reject short password', async () => {
            const res = await request(testApp)
                .post('/api/auth/register')
                .send({
                    full_name: 'Test User',
                    email: 'test@test.com',
                    password: '12345'
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user with valid token', async () => {
            const token = getAdminToken();
            const res = await request(testApp)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.user.email).toBe('admin@agrodrop.com');
        });

        it('should reject without token', async () => {
            const res = await request(testApp)
                .get('/api/auth/me');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Authentication required');
        });
    });

    describe('Health Check', () => {
        it('should return health status', async () => {
            const res = await request(testApp)
                .get('/api/health');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.mongodbConfigured).toBe(false);
            expect(res.body.supabaseConfigured).toBe(false);
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(testApp)
                .get('/api/nonexistent');

            expect(res.status).toBe(404);
            expect(res.body.status).toBe('error');
        });
    });
});

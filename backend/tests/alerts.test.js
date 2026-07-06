const request = require('supertest');
const { testApp, getAdminToken, resetState } = require('./setup');

beforeEach(() => {
    resetState();
});

describe('Alerts Routes', () => {
    describe('GET /api/alerts', () => {
        it('should return all alerts', async () => {
            const res = await request(testApp)
                .get('/api/alerts')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.alerts)).toBe(true);
            expect(typeof res.body.unreadCount).toBe('number');
        });

        it('should filter by status', async () => {
            const res = await request(testApp)
                .get('/api/alerts?status=unread')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.alerts.every((a) => a.status === 'unread')).toBe(true);
        });

        it('should reject invalid status filter', async () => {
            const res = await request(testApp)
                .get('/api/alerts?status=invalid')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(400);
        });

        it('should reject invalid alert_type filter', async () => {
            const res = await request(testApp)
                .get('/api/alerts?alert_type=invalid')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/alerts/:id/read', () => {
        it('should return 404 for non-existent alert', async () => {
            const res = await request(testApp)
                .patch('/api/alerts/nonexistent/read')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/alerts/:id/archive', () => {
        it('should return 404 for non-existent alert', async () => {
            const res = await request(testApp)
                .patch('/api/alerts/nonexistent/archive')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/alerts/all/read', () => {
        it('should mark all alerts as read', async () => {
            const res = await request(testApp)
                .patch('/api/alerts/all/read')
                .set('Authorization', `Bearer ${getAdminToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });
    });
});

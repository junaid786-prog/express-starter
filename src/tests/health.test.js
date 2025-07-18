const request = require('supertest');
const app = require('../config/app');

describe('Health check', () => {
    it('should return 200', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
    });
});

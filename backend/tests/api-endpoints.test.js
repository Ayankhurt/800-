/**
 * API Endpoints E2E Tests
 * 
 * Run with: npm test -- api-endpoints.test.js
 * 
 * Requires:
 * - Backend server running on TEST_API_URL
 * - Test user credentials in .env.test
 */

import request from 'supertest';
import { expect } from 'chai';

const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api/v1';
let authToken = '';
let refreshToken = '';
let testUserId = '';

describe('BidRoom API Endpoints E2E Tests', () => {
  describe('Authentication', () => {
    it('POST /auth/signup - should register new user', async () => {
      const response = await request(TEST_API_URL)
        .post('/auth/signup')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'Test123!@#',
          full_name: 'Test User',
          role_code: 'VIEWER',
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('user');
      expect(response.body.data).to.have.property('access_token');
      expect(response.body.data).to.have.property('refresh_token');

      authToken = response.body.data.access_token || response.body.data.token;
      refreshToken = response.body.data.refresh_token;
      testUserId = response.body.data.user.id;
    });

    it('POST /auth/login - should login user', async () => {
      const response = await request(TEST_API_URL)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password',
        });

      // May return 401 if credentials invalid (expected in test)
      if (response.status === 200) {
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('user');
        authToken = response.body.data.access_token || response.body.data.token;
        refreshToken = response.body.data.refresh_token;
      } else {
        expect(response.status).to.equal(401);
      }
    });

    it('GET /auth/me - should get current user', async () => {
      if (!authToken) {
        // Skip if no token
        return;
      }

      const response = await request(TEST_API_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('email');
    });

    it('POST /auth/refresh-token - should refresh token', async () => {
      if (!refreshToken) {
        return;
      }

      const response = await request(TEST_API_URL)
        .post('/auth/refresh-token')
        .send({ refresh_token: refreshToken });

      if (response.status === 200) {
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('access_token');
        expect(response.body.data).to.have.property('refresh_token');
        authToken = response.body.data.access_token;
        refreshToken = response.body.data.refresh_token;
      }
    });
  });

  describe('Jobs', () => {
    it('GET /jobs - should get jobs list', async () => {
      if (!authToken) return;

      const response = await request(TEST_API_URL)
        .get('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.not.be.false;
      expect(response.body.data).to.be.an('array');
    });

    it('GET /jobs/search - should search jobs', async () => {
      if (!authToken) return;

      const response = await request(TEST_API_URL)
        .get('/jobs/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'plumber' });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.not.be.false;
    });
  });

  describe('Uploads', () => {
    it('POST /uploads - should upload file', async () => {
      if (!authToken) return;

      // Create a test file buffer
      const testFile = Buffer.from('test image content');
      
      const response = await request(TEST_API_URL)
        .post('/uploads')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'test.jpg')
        .field('type', 'profile');

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('url');
      expect(response.body.data).to.have.property('file_name');
    });
  });

  describe('Notifications', () => {
    it('POST /notifications/register-device - should register device', async () => {
      if (!authToken) return;

      const response = await request(TEST_API_URL)
        .post('/notifications/register-device')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          device_token: 'test-fcm-token-123',
          platform: 'android',
          device_id: 'test-device-id',
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });

    it('GET /notifications - should get notifications', async () => {
      if (!authToken) return;

      const response = await request(TEST_API_URL)
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.not.be.false;
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for invalid token', async () => {
      const response = await request(TEST_API_URL)
        .get('/jobs')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).to.equal(401);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(TEST_API_URL)
        .post('/auth/login')
        .send({ email: 'invalid' }); // Missing password

      expect(response.status).to.equal(400);
    });

    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(TEST_API_URL)
        .get('/nonexistent');

      expect(response.status).to.equal(404);
    });
  });
});





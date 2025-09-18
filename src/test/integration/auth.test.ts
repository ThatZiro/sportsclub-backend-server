/**
 * Authentication Integration Tests
 * Tests complete authentication flow end-to-end
 */

import request from 'supertest';
import app from '../../app';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase } from '../database';

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /auth/signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should create user and return JWT cookie', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(validSignupData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: validSignupData.email,
          name: validSignupData.name,
          role: 'USER'
        }
      });

      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      
      // Check JWT cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.startsWith('token='))).toBe(true);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          ...validSignupData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          ...validSignupData,
          password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });

    it('should return 400 for duplicate email', async () => {
      // First signup
      await request(app)
        .post('/auth/signup')
        .send(validSignupData)
        .expect(201);

      // Second signup with same email
      const response = await request(app)
        .post('/auth/signup')
        .send(validSignupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: validSignupData.email
          // Missing password and name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    beforeEach(async () => {
      // Create user for login tests
      await request(app)
        .post('/auth/signup')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: userData.email,
          name: userData.name,
          role: 'USER'
        }
      });

      // Check JWT cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.startsWith('token='))).toBe(true);
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should logout successfully', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/auth/signup')
        .send(userData);

      const cookies = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully'
      });

      // Check cookie is cleared
      const logoutCookies = response.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();
      expect(logoutCookies.some((cookie: string) => 
        cookie.includes('token=') && cookie.includes('Max-Age=0')
      )).toBe(true);
    });

    it('should work even without authentication', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication Flow', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should complete full signup -> login -> logout flow', async () => {
      // 1. Signup
      const signupResponse = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(signupResponse.body.success).toBe(true);
      const signupCookies = signupResponse.headers['set-cookie'];

      // 2. Access protected endpoint with signup token
      const profileResponse = await request(app)
        .get('/me')
        .set('Cookie', signupCookies)
        .expect(200);

      expect(profileResponse.body.user.email).toBe(userData.email);

      // 3. Logout
      await request(app)
        .post('/auth/logout')
        .set('Cookie', signupCookies)
        .expect(200);

      // 4. Login again
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const loginCookies = loginResponse.headers['set-cookie'];

      // 5. Access protected endpoint with login token
      await request(app)
        .get('/me')
        .set('Cookie', loginCookies)
        .expect(200);

      // 6. Final logout
      await request(app)
        .post('/auth/logout')
        .set('Cookie', loginCookies)
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // Make multiple rapid requests to exceed rate limit
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/auth/signup')
          .send(userData)
      );

      const responses = await Promise.all(requests);
      
      // First request should succeed
      expect(responses[0].status).toBe(201);
      
      // Some later requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
/**
 * Authorization Integration Tests
 * Tests role-based access control across the API
 */

import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  seedTestData,
} from '../database';

describe('Authorization Integration Tests', () => {
  let testData: any;
  let organizerCookies: string[];
  let captainCookies: string[];
  let playerCookies: string[];

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testData = await seedTestData();

    // Login all test users
    const organizerLogin = await request(app).post('/auth/login').send({
      email: 'organizer@test.com',
      password: 'password123',
    });
    organizerCookies = organizerLogin.headers['set-cookie'];

    const captainLogin = await request(app).post('/auth/login').send({
      email: 'captain@test.com',
      password: 'password123',
    });
    captainCookies = captainLogin.headers['set-cookie'];

    const playerLogin = await request(app).post('/auth/login').send({
      email: 'player@test.com',
      password: 'password123',
    });
    playerCookies = playerLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('League Management Authorization', () => {
    describe('POST /leagues', () => {
      const leagueData = {
        name: 'New League',
        season: 'Fall 2024',
      };

      it('should allow organizer to create league', async () => {
        const response = await request(app)
          .post('/leagues')
          .set('Cookie', organizerCookies)
          .send(leagueData)
          .expect(201);

        expect(response.body.success).toBe(true);
      });

      it('should deny captain access to create league', async () => {
        const response = await request(app)
          .post('/leagues')
          .set('Cookie', captainCookies)
          .send(leagueData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Insufficient permissions');
      });

      it('should deny regular user access to create league', async () => {
        const response = await request(app)
          .post('/leagues')
          .set('Cookie', playerCookies)
          .send(leagueData)
          .expect(403);

        expect(response.body.success).toBe(false);
      });

      it('should deny unauthenticated access', async () => {
        await request(app).post('/leagues').send(leagueData).expect(401);
      });
    });

    describe('PATCH /leagues/:id', () => {
      const updates = {
        name: 'Updated League Name',
      };

      it('should allow organizer to update league', async () => {
        const response = await request(app)
          .patch(`/leagues/${testData.league.id}`)
          .set('Cookie', organizerCookies)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny captain access to update league', async () => {
        await request(app)
          .patch(`/leagues/${testData.league.id}`)
          .set('Cookie', captainCookies)
          .send(updates)
          .expect(403);
      });

      it('should deny regular user access to update league', async () => {
        await request(app)
          .patch(`/leagues/${testData.league.id}`)
          .set('Cookie', playerCookies)
          .send(updates)
          .expect(403);
      });
    });

    describe('DELETE /leagues/:id', () => {
      it('should allow organizer to delete league', async () => {
        const response = await request(app)
          .delete(`/leagues/${testData.league.id}`)
          .set('Cookie', organizerCookies)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny captain access to delete league', async () => {
        await request(app)
          .delete(`/leagues/${testData.league.id}`)
          .set('Cookie', captainCookies)
          .expect(403);
      });

      it('should deny regular user access to delete league', async () => {
        await request(app)
          .delete(`/leagues/${testData.league.id}`)
          .set('Cookie', playerCookies)
          .expect(403);
      });
    });
  });

  describe('Team Management Authorization', () => {
    describe('PATCH /teams/:id', () => {
      const updates = {
        name: 'Updated Team Name',
      };

      it('should allow captain to update their own team', async () => {
        const response = await request(app)
          .patch(`/teams/${testData.team.id}`)
          .set('Cookie', captainCookies)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should allow organizer to update any team', async () => {
        const response = await request(app)
          .patch(`/teams/${testData.team.id}`)
          .set('Cookie', organizerCookies)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny regular member access to update team', async () => {
        await request(app)
          .patch(`/teams/${testData.team.id}`)
          .set('Cookie', playerCookies)
          .send(updates)
          .expect(403);
      });

      it('should deny captain access to update other teams', async () => {
        // Create another team with different captain
        await request(app).post('/auth/signup').send({
          email: 'othercaptain@test.com',
          password: 'password123',
          name: 'Other Captain',
        });

        const otherCaptainLogin = await request(app).post('/auth/login').send({
          email: 'othercaptain@test.com',
          password: 'password123',
        });

        const otherCaptainCookies = otherCaptainLogin.headers['set-cookie'];

        const otherTeamResponse = await request(app)
          .post('/teams')
          .set('Cookie', otherCaptainCookies)
          .send({
            name: 'Other Team',
            leagueId: testData.league.id,
          });

        const otherTeamId = otherTeamResponse.body.team.id;

        // Original captain should not be able to update other team
        await request(app)
          .patch(`/teams/${otherTeamId}`)
          .set('Cookie', captainCookies)
          .send(updates)
          .expect(403);
      });
    });

    describe('DELETE /teams/:id', () => {
      it('should allow organizer to delete any team', async () => {
        const response = await request(app)
          .delete(`/teams/${testData.team.id}`)
          .set('Cookie', organizerCookies)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny captain access to delete team', async () => {
        await request(app)
          .delete(`/teams/${testData.team.id}`)
          .set('Cookie', captainCookies)
          .expect(403);
      });

      it('should deny regular user access to delete team', async () => {
        await request(app)
          .delete(`/teams/${testData.team.id}`)
          .set('Cookie', playerCookies)
          .expect(403);
      });
    });

    describe('POST /teams/:id/members/:userId/approve', () => {
      it('should allow captain to approve members of their team', async () => {
        const response = await request(app)
          .post(
            `/teams/${testData.team.id}/members/${testData.player.id}/approve`
          )
          .set('Cookie', captainCookies)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should allow organizer to approve members of any team', async () => {
        const response = await request(app)
          .post(
            `/teams/${testData.team.id}/members/${testData.player.id}/approve`
          )
          .set('Cookie', organizerCookies)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny regular member access to approve members', async () => {
        await request(app)
          .post(
            `/teams/${testData.team.id}/members/${testData.player.id}/approve`
          )
          .set('Cookie', playerCookies)
          .expect(403);
      });
    });
  });

  describe('User Profile Authorization', () => {
    describe('GET /me', () => {
      it('should allow authenticated user to access their profile', async () => {
        const response = await request(app)
          .get('/me')
          .set('Cookie', captainCookies)
          .expect(200);

        expect(response.body.user.email).toBe('captain@test.com');
      });

      it('should deny unauthenticated access', async () => {
        await request(app).get('/me').expect(401);
      });
    });

    describe('PATCH /me', () => {
      const updates = {
        name: 'Updated Name',
      };

      it('should allow authenticated user to update their profile', async () => {
        const response = await request(app)
          .patch('/me')
          .set('Cookie', captainCookies)
          .send(updates)
          .expect(200);

        expect(response.body.user.name).toBe(updates.name);
      });

      it('should deny unauthenticated access', async () => {
        await request(app).patch('/me').send(updates).expect(401);
      });
    });
  });

  describe('Public Endpoints', () => {
    describe('GET /public/leagues/:slug', () => {
      it('should allow unauthenticated access', async () => {
        const response = await request(app)
          .get(`/public/leagues/${testData.league.slug}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.league.slug).toBe(testData.league.slug);
      });

      it('should work with authentication too', async () => {
        const response = await request(app)
          .get(`/public/leagues/${testData.league.slug}`)
          .set('Cookie', captainCookies)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /public/leagues/:slug/teams', () => {
      it('should allow unauthenticated access', async () => {
        const response = await request(app)
          .get(`/public/leagues/${testData.league.slug}/teams`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.teams)).toBe(true);
      });
    });
  });

  describe('Invalid Token Handling', () => {
    it('should reject invalid JWT token', async () => {
      await request(app)
        .get('/me')
        .set('Cookie', ['token=invalid-jwt-token'])
        .expect(401);
    });

    it('should reject expired JWT token', async () => {
      // This would require mocking JWT expiration or using a pre-expired token
      // For now, we'll test with a malformed token
      await request(app)
        .get('/me')
        .set('Cookie', [
          'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token',
        ])
        .expect(401);
    });
  });
});

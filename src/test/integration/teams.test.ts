/**
 * Team Management Integration Tests
 * Tests complete team creation and joining workflows end-to-end
 */

import request from 'supertest';
import app from '../../app';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase, seedTestData } from '../database';

describe('Team Management Integration Tests', () => {
  let testData: any;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testData = await seedTestData();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /teams', () => {
    it('should create team successfully', async () => {
      // Login as captain
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'captain@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const teamData = {
        name: 'New Team',
        color: '#00FF00',
        leagueId: testData.league.id
      };

      const response = await request(app)
        .post('/teams')
        .set('Cookie', cookies)
        .send(teamData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        team: {
          name: teamData.name,
          color: teamData.color,
          leagueId: teamData.leagueId,
          captainId: testData.captain.id
        }
      });

      expect(response.body.team.id).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const teamData = {
        name: 'New Team',
        leagueId: testData.league.id
      };

      await request(app)
        .post('/teams')
        .send(teamData)
        .expect(401);
    });

    it('should return 400 for invalid data', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'captain@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post('/teams')
        .set('Cookie', cookies)
        .send({
          name: 'A', // Too short
          leagueId: testData.league.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for duplicate team name in league', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'captain@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post('/teams')
        .set('Cookie', cookies)
        .send({
          name: 'Test Team', // Already exists
          leagueId: testData.league.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /teams/:id', () => {
    it('should return team with members', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'captain@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .get(`/teams/${testData.team.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        team: {
          id: testData.team.id,
          name: testData.team.name,
          captainId: testData.captain.id
        }
      });

      expect(response.body.team.members).toBeDefined();
      expect(response.body.team.members.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent team', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'captain@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      await request(app)
        .get('/teams/non-existent-id')
        .set('Cookie', cookies)
        .expect(404);
    });
  });

  describe('POST /teams/:id/join', () => {
    it('should join team successfully', async () => {
      // Create a new user to join the team
      await request(app)
        .post('/auth/signup')
        .send({
          email: 'newplayer@test.com',
          password: 'password123',
          name: 'New Player'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'newplayer@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post(`/teams/${testData.team.id}/join`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        membership: {
          teamId: testData.team.id,
          role: 'MEMBER',
          status: 'PENDING'
        }
      });
    });

    it('should return 400 if already a member', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'player@test.com', // Already a member
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post(`/teams/${testData.team.id}/join`)
        .set('Cookie', cookies)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already a member');
    });

    it('should return 404 for non-existent team', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'captain@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      await request(app)
        .post('/teams/non-existent-id/join')
        .set('Cookie', cookies)
        .expect(404);
    });
  });

  describe('POST /teams/:id/members/:userId/approve', () => {
    it('should approve member as captain', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'captain@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post(`/teams/${testData.team.id}/members/${testData.player.id}/approve`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        membership: {
          teamId: testData.team.id,
          userId: testData.player.id,
          status: 'APPROVED'
        }
      });
    });

    it('should approve member as organizer', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'organizer@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post(`/teams/${testData.team.id}/members/${testData.player.id}/approve`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for regular user', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'player@test.com',
          password: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post(`/teams/${testData.team.id}/members/${testData.player.id}/approve`)
        .set('Cookie', cookies)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Team Creation and Joining Workflow', () => {
    it('should complete full team creation and joining workflow', async () => {
      // 1. Create new users
      await request(app)
        .post('/auth/signup')
        .send({
          email: 'newcaptain@test.com',
          password: 'password123',
          name: 'New Captain'
        });

      await request(app)
        .post('/auth/signup')
        .send({
          email: 'newmember@test.com',
          password: 'password123',
          name: 'New Member'
        });

      // 2. Captain creates team
      const captainLogin = await request(app)
        .post('/auth/login')
        .send({
          email: 'newcaptain@test.com',
          password: 'password123'
        });

      const captainCookies = captainLogin.headers['set-cookie'];

      const teamResponse = await request(app)
        .post('/teams')
        .set('Cookie', captainCookies)
        .send({
          name: 'Workflow Team',
          color: '#FF00FF',
          leagueId: testData.league.id
        })
        .expect(201);

      const teamId = teamResponse.body.team.id;

      // 3. Member joins team
      const memberLogin = await request(app)
        .post('/auth/login')
        .send({
          email: 'newmember@test.com',
          password: 'password123'
        });

      const memberCookies = memberLogin.headers['set-cookie'];

      await request(app)
        .post(`/teams/${teamId}/join`)
        .set('Cookie', memberCookies)
        .expect(200);

      // 4. Check team has pending member
      const teamCheck1 = await request(app)
        .get(`/teams/${teamId}`)
        .set('Cookie', captainCookies)
        .expect(200);

      const pendingMembers = teamCheck1.body.team.members.filter(
        (m: any) => m.status === 'PENDING'
      );
      expect(pendingMembers.length).toBe(1);

      // 5. Captain approves member
      const memberUserId = teamCheck1.body.team.members.find(
        (m: any) => m.user.email === 'newmember@test.com'
      ).userId;

      await request(app)
        .post(`/teams/${teamId}/members/${memberUserId}/approve`)
        .set('Cookie', captainCookies)
        .expect(200);

      // 6. Verify member is approved
      const teamCheck2 = await request(app)
        .get(`/teams/${teamId}`)
        .set('Cookie', captainCookies)
        .expect(200);

      const approvedMembers = teamCheck2.body.team.members.filter(
        (m: any) => m.status === 'APPROVED'
      );
      expect(approvedMembers.length).toBe(2); // Captain + approved member
    });
  });
});
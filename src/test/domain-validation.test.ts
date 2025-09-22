/**
 * Domain validation tests
 * Tests the core domain models and validation logic
 */

import {
  UserDomain,
  LeagueDomain,
  TeamDomain,
  TeamMemberDomain,
  UserRole,
  MemberRole,
  MemberStatus,
} from '../domain';

describe('Domain Validation Tests', () => {
  describe('UserDomain', () => {
    test('validates email correctly', () => {
      expect(UserDomain.isValidEmail('test@example.com')).toBe(true);
      expect(UserDomain.isValidEmail('invalid-email')).toBe(false);
      expect(UserDomain.isValidEmail('')).toBe(false);
    });

    test('validates name correctly', () => {
      expect(UserDomain.isValidName('John Doe')).toBe(true);
      expect(UserDomain.isValidName('A')).toBe(false); // Too short
      expect(UserDomain.isValidName('')).toBe(false);
    });

    test('validates password correctly', () => {
      expect(UserDomain.isValidPassword('password123')).toBe(true);
      expect(UserDomain.isValidPassword('short')).toBe(false); // Too short
      expect(UserDomain.isValidPassword('onlyletters')).toBe(false); // No numbers
    });

    test('checks organizer privileges', () => {
      const user = {
        id: 'test',
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        role: UserRole.ORGANIZER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(UserDomain.hasOrganizerPrivileges(user)).toBe(true);
    });
  });

  describe('LeagueDomain', () => {
    test('validates league name correctly', () => {
      expect(LeagueDomain.isValidName('Spring League')).toBe(true);
      expect(LeagueDomain.isValidName('AB')).toBe(false); // Too short
    });

    test('validates slug correctly', () => {
      expect(LeagueDomain.isValidSlug('spring-2024')).toBe(true);
      expect(LeagueDomain.isValidSlug('Spring 2024')).toBe(false); // Contains spaces/uppercase
    });

    test('generates slug from name', () => {
      expect(LeagueDomain.generateSlug('Spring 2024 League')).toBe(
        'spring-2024-league'
      );
      expect(LeagueDomain.generateSlug('Test League!')).toBe('test-league');
    });
  });

  describe('TeamDomain', () => {
    test('validates team name correctly', () => {
      expect(TeamDomain.isValidName('Team Alpha')).toBe(true);
      expect(TeamDomain.isValidName('A')).toBe(false); // Too short
    });

    test('validates color correctly', () => {
      expect(TeamDomain.isValidColor('#FF0000')).toBe(true);
      expect(TeamDomain.isValidColor('#F00')).toBe(true);
      expect(TeamDomain.isValidColor('red')).toBe(false); // Not hex
    });

    test('normalizes color correctly', () => {
      expect(TeamDomain.normalizeColor('#ff0000')).toBe('#FF0000');
      expect(TeamDomain.normalizeColor(undefined)).toBe(undefined);
    });
  });

  describe('TeamMemberDomain', () => {
    test('checks member status correctly', () => {
      const member = {
        id: 'test',
        teamId: 'team1',
        userId: 'user1',
        role: MemberRole.MEMBER,
        status: MemberStatus.APPROVED,
        createdAt: new Date(),
      };

      expect(TeamMemberDomain.isApproved(member)).toBe(true);
      expect(TeamMemberDomain.isPending(member)).toBe(false);
      expect(TeamMemberDomain.isActiveMember(member)).toBe(true);
    });

    test('creates captain member data correctly', () => {
      const captainData = TeamMemberDomain.createCaptainMemberData(
        'team1',
        'user1'
      );

      expect(captainData.role).toBe(MemberRole.CAPTAIN);
      expect(captainData.status).toBe(MemberStatus.APPROVED);
    });
  });
});

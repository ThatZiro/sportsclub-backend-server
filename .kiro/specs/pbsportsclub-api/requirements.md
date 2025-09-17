# Requirements Document

## Introduction

The PBSportsClub API is a minimal TypeScript/Node.js backend designed to support a single-page web form for player registration in sports leagues. The system focuses on a "one league" assumption where users can either create a team in the active league (becoming captain) or join an existing team. The API provides CRUD operations for Users, Leagues, and Teams with JWT-based authentication and comprehensive documentation.

## Requirements

### Requirement 1

**User Story:** As a player, I want to sign up for an account with my name, email, and password, so that I can participate in the league system.

#### Acceptance Criteria

1. WHEN a user submits valid signup data (name, email, password) THEN the system SHALL create a new user account with hashed password
2. WHEN a user submits an email that already exists THEN the system SHALL return an error indicating the email is already registered
3. WHEN a user submits invalid data (missing fields, invalid email format) THEN the system SHALL return validation errors
4. WHEN a user account is created THEN the system SHALL assign the default role of USER

### Requirement 2

**User Story:** As a registered user, I want to log in with my email and password, so that I can access authenticated features.

#### Acceptance Criteria

1. WHEN a user submits valid login credentials THEN the system SHALL authenticate the user and return a JWT token in an HTTP-only cookie
2. WHEN a user submits invalid credentials THEN the system SHALL return an authentication error
3. WHEN a user is authenticated THEN the system SHALL provide access to protected endpoints
4. WHEN a user logs out THEN the system SHALL invalidate the JWT token

### Requirement 3

**User Story:** As a visitor, I want to view league information and available teams without authentication, so that I can decide whether to join.

#### Acceptance Criteria

1. WHEN a visitor requests league information by slug THEN the system SHALL return league details (name, season, status)
2. WHEN a visitor requests teams for a league THEN the system SHALL return team list with names, captain names, and member counts
3. WHEN a visitor requests a non-existent league THEN the system SHALL return a not found error
4. WHEN the system returns public data THEN it SHALL not require authentication

### Requirement 4

**User Story:** As an authenticated user, I want to create a new team in the active league, so that I can become a team captain and recruit players.

#### Acceptance Criteria

1. WHEN a user creates a team with valid data (name, color, leagueId) THEN the system SHALL create the team with the user as captain
2. WHEN a team is created THEN the system SHALL automatically add the captain as an APPROVED team member
3. WHEN a user tries to create a team with a name that already exists in the league THEN the system SHALL return a conflict error
4. WHEN a user creates a team THEN the system SHALL assign them the CAPTAIN role for that team

### Requirement 5

**User Story:** As an authenticated user, I want to join an existing team, so that I can participate in the league.

#### Acceptance Criteria

1. WHEN a user requests to join a team THEN the system SHALL create a team membership with PENDING status
2. IF AUTO_APPROVE_JOINS is enabled THEN the system SHALL automatically approve the membership
3. WHEN a user tries to join a team they're already a member of THEN the system SHALL return an error
4. WHEN a user joins a team THEN the system SHALL assign them the MEMBER role

### Requirement 6

**User Story:** As a team captain, I want to approve pending team members, so that I can control who joins my team.

#### Acceptance Criteria

1. WHEN a captain approves a pending member THEN the system SHALL change the member status to APPROVED
2. WHEN a non-captain tries to approve members THEN the system SHALL return an authorization error
3. WHEN an organizer approves members THEN the system SHALL allow the action regardless of team ownership
4. WHEN approving a non-existent membership THEN the system SHALL return a not found error

### Requirement 7

**User Story:** As an organizer, I want to manage leagues (create, read, update, delete), so that I can administer the sports program.

#### Acceptance Criteria

1. WHEN an organizer creates a league THEN the system SHALL create the league with a unique slug
2. WHEN an organizer updates league information THEN the system SHALL modify the specified fields
3. WHEN an organizer deletes a league THEN the system SHALL remove the league and cascade delete related teams
4. WHEN a non-organizer tries to manage leagues THEN the system SHALL return an authorization error

### Requirement 8

**User Story:** As an organizer, I want to manage teams across all leagues, so that I can maintain the system integrity.

#### Acceptance Criteria

1. WHEN an organizer views any team THEN the system SHALL provide full team details including members
2. WHEN an organizer updates any team THEN the system SHALL allow modifications regardless of ownership
3. WHEN an organizer deletes a team THEN the system SHALL remove the team and all memberships
4. WHEN an organizer manages teams THEN the system SHALL log these administrative actions

### Requirement 9

**User Story:** As a developer, I want comprehensive API documentation, so that I can integrate with the system effectively.

#### Acceptance Criteria

1. WHEN accessing /docs THEN the system SHALL provide Swagger/OpenAPI documentation
2. WHEN viewing the documentation THEN it SHALL include all endpoints with request/response examples
3. WHEN the API changes THEN the documentation SHALL be automatically updated
4. WHEN using the documentation THEN it SHALL provide interactive testing capabilities

### Requirement 10

**User Story:** As a system administrator, I want the application to run in Docker containers, so that I can deploy and scale it easily.

#### Acceptance Criteria

1. WHEN running docker compose up THEN the system SHALL start the API server and PostgreSQL database
2. WHEN the containers start THEN the system SHALL automatically run database migrations
3. WHEN the system initializes THEN it SHALL seed the database with the configured league and sample teams
4. WHEN environment variables are provided THEN the system SHALL use them for configuration

### Requirement 11

**User Story:** As a security-conscious administrator, I want proper authentication and rate limiting, so that the system is protected from abuse.

#### Acceptance Criteria

1. WHEN users access auth endpoints THEN the system SHALL enforce a rate limit of 10 requests per minute
2. WHEN passwords are stored THEN the system SHALL hash them using bcrypt
3. WHEN JWT tokens are issued THEN the system SHALL store them in HTTP-only cookies
4. WHEN validating inputs THEN the system SHALL use Zod schemas for type safety

### Requirement 12

**User Story:** As a quality assurance engineer, I want comprehensive tests, so that I can ensure the system works correctly.

#### Acceptance Criteria

1. WHEN running unit tests THEN the system SHALL test authentication, team creation, and team joining flows
2. WHEN running integration tests THEN the system SHALL test end-to-end signup and team management workflows
3. WHEN tests execute THEN they SHALL use Jest and supertest frameworks
4. WHEN code changes are made THEN the tests SHALL validate core functionality remains intact
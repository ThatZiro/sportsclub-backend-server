# Design Document

## Overview

The PBSportsClub API is designed as a clean architecture TypeScript/Node.js application using Express, Prisma ORM, and PostgreSQL. The system follows domain-driven design principles with clear separation between domain logic, application services, infrastructure, and API interfaces. The architecture supports the "one league" assumption while remaining extensible for future multi-league scenarios.

## Architecture

The application follows a layered architecture pattern:

```
┌─────────────────────────────────────────┐
│           API Layer (Express)            │
│  Controllers, Routes, Middleware, Docs   │
├─────────────────────────────────────────┤
│        Application Layer                 │
│     Services, Use Cases, DTOs            │
├─────────────────────────────────────────┤
│          Domain Layer                    │
│    Models, Entities, Business Rules      │
├─────────────────────────────────────────┤
│       Infrastructure Layer              │
│   Database, Repositories, External APIs  │
└─────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Clean Architecture**: Separates concerns and makes the system testable and maintainable
2. **Repository Pattern**: Abstracts data access and enables easy testing with mocks
3. **Service Layer**: Encapsulates business logic and orchestrates domain operations
4. **JWT in HTTP-only Cookies**: Provides security against XSS attacks while maintaining usability
5. **Environment-based Configuration**: Supports the "one league" assumption through LEAGUE_SLUG

## Components and Interfaces

### Domain Models

#### User Entity
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  USER = 'USER',
  ORGANIZER = 'ORGANIZER', 
  ADMIN = 'ADMIN'
}
```

#### League Entity
```typescript
interface League {
  id: string;
  name: string;
  slug: string;
  season?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Team Entity
```typescript
interface Team {
  id: string;
  name: string;
  color?: string;
  leagueId: string;
  captainId: string;
  createdAt: Date;
}
```

#### TeamMember Entity
```typescript
interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
}

enum MemberRole {
  CAPTAIN = 'CAPTAIN',
  MEMBER = 'MEMBER'
}

enum MemberStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
```

### Application Services

#### AuthService
- `signup(userData: SignupDTO): Promise<AuthResult>`
- `login(credentials: LoginDTO): Promise<AuthResult>`
- `logout(): Promise<void>`
- `validateToken(token: string): Promise<User>`

#### UserService
- `getUserProfile(userId: string): Promise<User>`
- `updateUserProfile(userId: string, updates: UpdateUserDTO): Promise<User>`

#### LeagueService
- `getLeagueBySlug(slug: string): Promise<League>`
- `createLeague(leagueData: CreateLeagueDTO): Promise<League>`
- `updateLeague(id: string, updates: UpdateLeagueDTO): Promise<League>`
- `deleteLeague(id: string): Promise<void>`
- `getAllLeagues(): Promise<League[]>`

#### TeamService
- `createTeam(teamData: CreateTeamDTO, captainId: string): Promise<Team>`
- `getTeamById(id: string): Promise<TeamWithMembers>`
- `updateTeam(id: string, updates: UpdateTeamDTO): Promise<Team>`
- `deleteTeam(id: string): Promise<void>`
- `getTeamsByLeague(leagueId: string): Promise<TeamSummary[]>`
- `joinTeam(teamId: string, userId: string): Promise<TeamMember>`
- `approveMember(teamId: string, userId: string, approverId: string): Promise<TeamMember>`

### Infrastructure Layer

#### Database Connection
- Prisma client initialization and connection management
- Connection pooling and error handling
- Migration and seeding utilities

#### Repositories
- `UserRepository`: CRUD operations for users
- `LeagueRepository`: CRUD operations for leagues  
- `TeamRepository`: CRUD operations for teams and memberships
- `TeamMemberRepository`: Membership management operations

### API Layer

#### Controllers
- `AuthController`: Handles authentication endpoints
- `UserController`: Manages user profile operations
- `LeagueController`: Handles league CRUD operations
- `TeamController`: Manages team operations and memberships
- `PublicController`: Serves public endpoints for league/team data

#### Middleware
- `authMiddleware`: JWT validation and user context injection
- `roleGuard`: Role-based access control
- `rateLimiter`: Request rate limiting for auth endpoints
- `errorHandler`: Centralized error handling and logging
- `validator`: Zod schema validation for request bodies

#### Routes Structure
```
/auth
  POST /signup
  POST /login  
  POST /logout

/me
  GET /
  PATCH /

/leagues (ORGANIZER/ADMIN only)
  POST /
  GET /
  GET /:id
  PATCH /:id
  DELETE /:id
  GET /:id/teams

/teams
  POST /
  GET /:id
  PATCH /:id (captain/organizer)
  DELETE /:id (organizer)
  POST /:id/join
  POST /:id/members/:userId/approve

/public
  GET /leagues/:slug
  GET /leagues/:slug/teams

/docs (Swagger UI)
```

## Data Models

### Database Schema (Prisma)

The database uses PostgreSQL with the following key design decisions:

1. **CUID for IDs**: More secure and URL-safe than sequential integers
2. **Unique Constraints**: Email uniqueness, league slug uniqueness, team name per league
3. **Cascade Deletes**: Proper cleanup when leagues or teams are deleted
4. **Indexes**: On frequently queried fields (email, slug, leagueId)
5. **Enums**: Type safety for roles and statuses

### Key Relationships
- User 1:N TeamMember (a user can be on multiple teams)
- User 1:N Team (as captain)
- League 1:N Team
- Team 1:N TeamMember

## Error Handling

### Error Types
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}
```

### Error Handling Strategy
1. **Domain Layer**: Throws domain-specific errors
2. **Application Layer**: Catches domain errors and translates to application errors
3. **API Layer**: Global error handler converts errors to HTTP responses
4. **Logging**: All errors logged with context and stack traces
5. **Client Response**: Sanitized error messages in production

## Testing Strategy

### Unit Tests
- **Domain Models**: Test business logic and validation rules
- **Services**: Test use cases with mocked repositories
- **Repositories**: Test data access patterns with test database
- **Utilities**: Test helper functions and validation schemas

### Integration Tests
- **API Endpoints**: Test complete request/response cycles
- **Authentication Flow**: Test signup, login, logout sequences
- **Team Management**: Test create team and join team workflows
- **Authorization**: Test role-based access control

### Test Structure
```typescript
// Example test structure
describe('TeamService', () => {
  describe('createTeam', () => {
    it('should create team and add captain as approved member', async () => {
      // Test implementation
    });
    
    it('should throw error for duplicate team name in league', async () => {
      // Test implementation  
    });
  });
});
```

### Test Database
- Separate test database with same schema
- Database reset between test suites
- Seed data for consistent test scenarios
- Transaction rollback for test isolation

## Security Considerations

### Authentication & Authorization
- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: Short-lived (1 hour) with refresh capability
- **HTTP-only Cookies**: Prevents XSS token theft
- **Role-based Access**: Middleware enforces permissions

### Input Validation
- **Zod Schemas**: Runtime type checking and validation
- **SQL Injection**: Prisma ORM provides protection
- **XSS Prevention**: Input sanitization and output encoding

### Rate Limiting
- **Auth Endpoints**: 10 requests per minute per IP
- **General API**: 100 requests per minute per IP
- **Sliding Window**: More sophisticated rate limiting algorithm

### Environment Security
- **Secrets Management**: Environment variables for sensitive data
- **CORS Configuration**: Restrict origins in production
- **Security Headers**: Helmet.js for security headers

## Performance Considerations

### Database Optimization
- **Indexes**: On frequently queried columns (email, slug, leagueId)
- **Connection Pooling**: Prisma connection pool configuration
- **Query Optimization**: Efficient joins and selective field loading

### Caching Strategy
- **League Data**: Cache active league information
- **Team Lists**: Cache team summaries for public endpoints
- **Redis Integration**: Future enhancement for distributed caching

### API Performance
- **Pagination**: Implement for large result sets
- **Field Selection**: Allow clients to specify required fields
- **Compression**: Gzip compression for responses

## Deployment Architecture

### Docker Configuration
```yaml
# docker-compose.yml structure
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL
      - JWT_SECRET
    depends_on:
      - db
      
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=pbsports
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Environment Configuration
- **Development**: Docker Compose with local PostgreSQL
- **Production**: Environment-specific configurations
- **Secrets**: External secret management integration
- **Monitoring**: Health check endpoints and logging

## API Documentation

### Swagger/OpenAPI Integration
- **Automatic Generation**: From TypeScript types and decorators
- **Interactive Testing**: Swagger UI at /docs endpoint
- **Schema Validation**: Request/response validation
- **Examples**: Comprehensive request/response examples

### Documentation Structure
- **Authentication**: JWT token usage and endpoints
- **Error Responses**: Standard error format documentation
- **Rate Limits**: Documented limits and headers
- **Versioning**: API version strategy for future changes
# PBSportsClub API

A minimal TypeScript/Node.js backend designed to support a single-page web form for player registration in sports leagues.

## Features

- User authentication with JWT tokens
- Team creation and management
- League administration
- Public league and team information access
- Role-based access control
- Comprehensive API documentation with Swagger

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod schemas
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
src/
├── api/                 # API layer (controllers, routes, middleware)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication, validation, error handling
│   ├── routes/          # Route definitions
│   └── validators/      # Zod validation schemas
├── application/         # Application layer (services, DTOs)
│   ├── services/        # Business logic services
│   └── dtos/           # Data Transfer Objects
├── domain/             # Domain layer (entities, business rules)
│   ├── entities/       # Domain entities
│   ├── enums/          # Domain enums
│   └── errors/         # Domain-specific errors
├── infrastructure/     # Infrastructure layer (database, external services)
│   ├── database/       # Database configuration
│   └── repositories/   # Data access implementations
├── config/             # Configuration files
├── scripts/            # Database seeding and utility scripts
└── test/              # Test utilities and setup
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Docker (optional, for containerized development)

### Installation

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up the database (instructions will be added in subsequent tasks)
5. Run the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Environment Variables

See `.env.example` for all available configuration options.

## API Examples

### Authentication

#### Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Logout
```bash
POST /api/auth/logout
```

### User Management

#### Get Current User Profile
```bash
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```bash
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

#### Update User Role (Admin Only)
```bash
PUT /api/users/:userId/role
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

### League Management

#### Create League (Admin Only)
```bash
POST /api/leagues
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "Summer Basketball League",
  "slug": "summer-basketball-2024",
  "season": "Summer 2024",
  "isActive": true
}
```

#### Get All Leagues
```bash
GET /api/leagues
```

#### Get League by ID
```bash
GET /api/leagues/:id
```

#### Get League by Slug
```bash
GET /api/leagues/slug/:slug
```

#### Update League (Admin Only)
```bash
PUT /api/leagues/:id
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "Updated League Name",
  "isActive": false
}
```

#### Delete League (Admin Only)
```bash
DELETE /api/leagues/:id
Authorization: Bearer <admin-jwt-token>
```

### Team Management

#### Create Team
```bash
POST /api/teams
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Thunder Bolts",
  "color": "#FF5733",
  "leagueId": "clh1234567890abcdef"
}
```

#### Get Teams by League
```bash
GET /api/leagues/:leagueId/teams
```

#### Get Team by ID
```bash
GET /api/teams/:id
```

#### Update Team (Captain/Admin Only)
```bash
PUT /api/teams/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Lightning Bolts",
  "color": "#33FF57",
  "captainId": "clh0987654321fedcba"
}
```

#### Join Team
```bash
POST /api/teams/:id/join
Authorization: Bearer <jwt-token>
```

#### Approve Team Member (Captain/Admin Only)
```bash
POST /api/teams/:id/members/:userId/approve
Authorization: Bearer <jwt-token>
```

#### Delete Team (Captain/Admin Only)
```bash
DELETE /api/teams/:id
Authorization: Bearer <jwt-token>
```

### Response Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "clh1234567890abcdef",
    "name": "Thunder Bolts",
    "color": "#FF5733",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Team name must be at least 2 characters",
    "details": [
      {
        "field": "name",
        "message": "Team name must be at least 2 characters"
      }
    ]
  }
}
```

## API Documentation

Once the server is running, comprehensive API documentation is available at `/docs`.

## License

MIT
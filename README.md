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

## API Documentation

Once the server is running, API documentation is available at `/docs`.

## License

MIT
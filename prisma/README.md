# Database Setup

This directory contains the Prisma schema and database configuration for the PBSportsClub API.

## Schema Overview

The database schema includes the following models:

- **User**: Stores user accounts with authentication and role information
- **League**: Represents sports leagues with unique slugs
- **Team**: Teams within leagues with captains and colors
- **TeamMember**: Junction table for team memberships with roles and status

## Key Features

- **CUID IDs**: All models use CUID for secure, URL-safe identifiers
- **Cascade Deletes**: Proper cleanup when leagues or teams are deleted
- **Unique Constraints**: Prevents duplicate emails, league slugs, and team names per league
- **Enums**: Type-safe roles and statuses
- **Indexes**: Optimized for common queries

## Development Setup

1. **Start PostgreSQL** (using Docker):
   ```bash
   npm run docker:db
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Run Migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Seed Database**:
   ```bash
   npm run db:seed
   ```

5. **Complete Setup** (all steps above):
   ```bash
   npm run db:setup
   ```

## Useful Commands

- `npm run db:studio` - Open Prisma Studio for database browsing
- `npm run db:migrate:reset` - Reset database and run all migrations
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `docker-compose down` - Stop all Docker services

## Environment Variables

Make sure your `.env` file contains:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pbsports"
```

## Schema Changes

When making schema changes:

1. Update `schema.prisma`
2. Run `npm run db:migrate` to create and apply migration
3. The Prisma client will be automatically regenerated

## Seeding

The seed script creates:
- A default league (configured via environment variables)
- Sample organizer user
- Sample regular users
- Sample teams with captains and members

Test credentials:
- Organizer: `organizer@pbsports.com` / `organizer123`
- Users: `user1@example.com` / `user1123`, etc.
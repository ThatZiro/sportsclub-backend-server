# Docker Deployment Guide

This guide covers how to deploy the PBSportsClub API using Docker and Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (usually included with Docker Desktop)
- Git (to clone the repository)

## Quick Start

### 1. Environment Setup

First, create your production environment file:

```bash
# Copy the production template
cp .env.production .env.production.local

# Edit the file with your production values
# IMPORTANT: Update JWT_SECRET and database passwords!
```

### 2. Deploy with Scripts

#### Linux/Mac/WSL:
```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh deploy
```

#### Windows PowerShell:
```powershell
# Run deployment
.\scripts\deploy.ps1 deploy
```

#### Using npm scripts:
```bash
# Linux/Mac/WSL
npm run deploy

# Windows
npm run deploy:windows
```

### 3. Verify Deployment

After deployment, the API will be available at:
- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## Manual Deployment

If you prefer to run commands manually:

### 1. Build Images
```bash
docker-compose build
```

### 2. Start Database
```bash
docker-compose up -d db
```

### 3. Run Migrations
```bash
docker-compose --profile migration up db-migrate
```

### 4. Start API
```bash
docker-compose --profile full-stack up -d
```

## Configuration

### Environment Variables

The deployment uses the following key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/pbsports` |
| `JWT_SECRET` | JWT signing secret (CHANGE IN PRODUCTION!) | - |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | API server port | `3000` |
| `LEAGUE_SLUG` | Default league identifier | `spring-2024` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |

### Docker Compose Profiles

The deployment uses Docker Compose profiles to control which services run:

- **Default**: Only database
- **full-stack**: Database + API
- **migration**: Database + Migration runner

### Secrets Management

For production deployments, consider using Docker secrets or external secret management:

```yaml
# Example using Docker secrets
services:
  api:
    secrets:
      - jwt_secret
      - db_password
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
      - DB_PASSWORD_FILE=/run/secrets/db_password

secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

## Management Commands

### Deployment Script Commands

```bash
# Full deployment
./scripts/deploy.sh deploy

# Check status
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs [service_name]

# Restart services
./scripts/deploy.sh restart

# Clean up (stop and remove containers)
./scripts/deploy.sh cleanup
```

### Docker Compose Commands

```bash
# View running services
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down

# Restart a service
docker-compose restart [service_name]

# Execute commands in containers
docker-compose exec api sh
docker-compose exec db psql -U postgres -d pbsports
```

## Database Management

### Backup Database
```bash
docker-compose exec db pg_dump -U postgres pbsports > backup.sql
```

### Restore Database
```bash
docker-compose exec -T db psql -U postgres pbsports < backup.sql
```

### Access Database
```bash
docker-compose exec db psql -U postgres -d pbsports
```

## Monitoring and Health Checks

### Health Check Endpoints

- **API Health**: `GET /health`
- **Database Health**: Built into Docker Compose health checks

### Viewing Health Status
```bash
# Check container health
docker-compose ps

# View detailed health check logs
docker inspect pbsports-api | grep -A 10 Health
```

### Log Monitoring
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service logs
docker-compose logs -f api
docker-compose logs -f db

# View recent logs
docker-compose logs --tail=100 api
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

#### 2. API Won't Start
```bash
# Check API logs
docker-compose logs api

# Check if database is healthy
docker-compose ps

# Restart API
docker-compose restart api
```

#### 3. Migration Failures
```bash
# Check migration logs
docker-compose --profile migration logs db-migrate

# Reset database (WARNING: This will delete all data)
docker-compose down -v
docker-compose up -d db
docker-compose --profile migration up db-migrate
```

#### 4. Port Conflicts
If port 3000 or 5432 are already in use:

```bash
# Change ports in .env.production.local
API_PORT=3001
DB_PORT=5433

# Or use different ports in docker-compose override
echo "
version: '3.8'
services:
  api:
    ports:
      - '3001:3000'
  db:
    ports:
      - '5433:5432'
" > docker-compose.override.yml
```

### Debug Mode

To run containers in debug mode:

```bash
# Run API in foreground with logs
docker-compose --profile full-stack up api

# Run with debug environment
NODE_ENV=development docker-compose --profile full-stack up
```

## Production Considerations

### Security
- Change default passwords and JWT secrets
- Use Docker secrets for sensitive data
- Configure firewall rules
- Enable HTTPS with reverse proxy (nginx/traefik)
- Regular security updates

### Performance
- Configure resource limits in docker-compose.yml
- Set up log rotation
- Monitor resource usage
- Consider using production-grade PostgreSQL settings

### Backup Strategy
- Regular database backups
- Container image versioning
- Configuration backup
- Disaster recovery plan

### Scaling
- Use Docker Swarm or Kubernetes for multi-node deployment
- Configure load balancing
- Database replication for high availability
- Monitoring and alerting setup

## Development vs Production

### Development
```bash
# Use development environment
cp .env.example .env
npm run docker:db
npm run dev
```

### Production
```bash
# Use production environment
cp .env.production .env.production.local
# Edit .env.production.local with production values
./scripts/deploy.sh deploy
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Docker and application logs
3. Verify environment configuration
4. Check Docker and system resources
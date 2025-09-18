# Deployment Guide

This document provides instructions for setting up CI/CD deployment to AWS EC2 using GitHub Actions.

## Prerequisites

### AWS EC2 Setup

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS or later
   - t3.small or larger (recommended for Docker)
   - Security group allowing inbound traffic on ports 22 (SSH), 80 (HTTP), and 3000 (API)
   - Key pair for SSH access

2. **Initial Server Setup**
   ```bash
   # Connect to your EC2 instance
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker and Docker Compose
   sudo apt install -y docker.io docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ubuntu
   
   # Log out and back in for group changes to take effect
   exit
   ```

3. **Database Setup** (Optional - if using external database)
   - Set up RDS PostgreSQL instance
   - Configure security groups for database access
   - Note the connection string for environment variables

## GitHub Repository Setup

### Required Secrets

Configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `EC2_HOST` | EC2 instance public IP or domain | `3.123.45.67` |
| `EC2_USER` | SSH username (usually `ubuntu`) | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key content | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-here` |
| `LEAGUE_SLUG` | Default league slug | `pbsports` |

### Setting up SSH Key

1. **Generate SSH Key Pair** (if you don't have one)
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"
   ```

2. **Add Public Key to EC2**
   ```bash
   # Copy public key to EC2 instance
   ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@your-ec2-ip
   
   # Or manually add to ~/.ssh/authorized_keys on EC2
   ```

3. **Add Private Key to GitHub Secrets**
   - Copy the entire private key content (including headers)
   - Add as `EC2_SSH_KEY` secret in GitHub

## Deployment Workflow

### Automatic Deployment

The CI/CD pipeline automatically triggers on:
- Push to `main` branch
- Pull requests to `main` branch (testing only)

### Manual Deployment

You can also deploy manually using the deployment scripts:

1. **Build and Package**
   ```bash
   npm run build
   tar -czf deployment.tar.gz dist package*.json prisma docker-compose.yml Dockerfile scripts/
   ```

2. **Deploy to Server**
   ```bash
   # Copy files to server
   scp deployment.tar.gz ubuntu@your-ec2-ip:/home/ubuntu/
   
   # SSH to server and deploy
   ssh ubuntu@your-ec2-ip
   mkdir -p pbsportsclub-api/current
   cd pbsportsclub-api/current
   tar -xzf ../../deployment.tar.gz
   
   # Set up environment
   echo "DATABASE_URL=your-database-url" > .env
   echo "JWT_SECRET=your-jwt-secret" >> .env
   echo "NODE_ENV=production" >> .env
   
   # Deploy
   chmod +x scripts/deploy.sh scripts/health-check.sh
   ./scripts/deploy.sh
   ```

## Deployment Process

### 1. Testing Phase
- Runs unit and integration tests
- Performs linting and code quality checks
- Builds the application
- Only proceeds to deployment if all tests pass

### 2. Deployment Phase
- Creates deployment package with built application
- Copies files to EC2 instance via SSH
- Backs up current deployment
- Extracts new deployment files
- Sets up environment variables
- Runs deployment script

### 3. Health Checks
- Waits for application to start
- Verifies API health endpoint responds
- Tests database connectivity
- Validates key API endpoints
- Rolls back if health checks fail

### 4. Rollback Process
If deployment fails:
- Stops new deployment containers
- Restores previous backup
- Restarts previous version
- Reports rollback status

## Monitoring and Troubleshooting

### Health Check Endpoints

- **API Health**: `GET /health`
- **Public League**: `GET /public/leagues/pbsports`
- **API Documentation**: `GET /docs`

### Logs and Debugging

```bash
# SSH to EC2 instance
ssh ubuntu@your-ec2-ip

# Navigate to deployment directory
cd /home/ubuntu/pbsportsclub-api/current

# View application logs
docker-compose logs api

# View database logs
docker-compose logs db

# Check container status
docker-compose ps

# Manual health check
./scripts/health-check.sh
```

### Common Issues

1. **Port Already in Use**
   ```bash
   # Stop existing containers
   docker-compose down
   
   # Check for processes using port 3000
   sudo lsof -i :3000
   ```

2. **Database Connection Issues**
   ```bash
   # Check database container
   docker-compose logs db
   
   # Test database connectivity
   docker-compose exec db psql -U postgres -d pbsports -c "SELECT 1;"
   ```

3. **Permission Issues**
   ```bash
   # Fix script permissions
   chmod +x scripts/*.sh
   
   # Fix Docker permissions
   sudo usermod -aG docker $USER
   ```

## Security Considerations

### Environment Variables
- Never commit secrets to version control
- Use GitHub Secrets for sensitive data
- Rotate JWT secrets regularly
- Use strong database passwords

### Network Security
- Configure EC2 security groups properly
- Use HTTPS in production (add reverse proxy)
- Implement rate limiting
- Monitor access logs

### SSH Security
- Use key-based authentication only
- Disable password authentication
- Regularly rotate SSH keys
- Monitor SSH access logs

## Production Optimizations

### Performance
- Use production Docker images
- Enable gzip compression
- Implement caching strategies
- Monitor resource usage

### Scaling
- Use Application Load Balancer
- Implement auto-scaling groups
- Use RDS for database
- Add Redis for caching

### Monitoring
- Set up CloudWatch monitoring
- Implement application metrics
- Configure alerts for failures
- Monitor deployment success rates

## Environment-Specific Configuration

### Development
```bash
# Local development with Docker
docker-compose -f docker-compose.dev.yml up
```

### Staging
```bash
# Staging environment variables
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db-url
```

### Production
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://production-db-url
JWT_SECRET=production-jwt-secret
```

## Backup and Recovery

### Database Backups
```bash
# Create database backup
docker-compose exec db pg_dump -U postgres pbsports > backup.sql

# Restore database backup
docker-compose exec -T db psql -U postgres pbsports < backup.sql
```

### Application Backups
- Previous deployment is automatically backed up
- Manual backups can be created before major changes
- Configuration files should be version controlled

## Support and Maintenance

### Regular Tasks
- Monitor deployment success rates
- Review application logs
- Update dependencies regularly
- Rotate secrets periodically

### Emergency Procedures
- Rollback process is automated
- Manual rollback instructions provided
- Emergency contact procedures
- Incident response playbook
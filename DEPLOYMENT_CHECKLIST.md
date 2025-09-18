# Deployment Checklist

Use this checklist to ensure a successful deployment to AWS EC2.

## Pre-Deployment Setup

### ✅ AWS EC2 Instance Setup

- [ ] Launch Ubuntu 22.04 LTS EC2 instance (t3.small or larger)
- [ ] Configure security group:
  - [ ] SSH (port 22) from your IP
  - [ ] HTTP (port 80) from anywhere (0.0.0.0/0)
  - [ ] Custom TCP (port 3000) from anywhere (0.0.0.0/0)
- [ ] Create or use existing key pair for SSH access
- [ ] Note down public IP address
- [ ] Test SSH connection: `ssh -i your-key.pem ubuntu@your-ec2-ip`

### ✅ Server Initial Configuration

- [ ] Connect to EC2 instance via SSH
- [ ] Update system packages: `sudo apt update && sudo apt upgrade -y`
- [ ] Install Docker: `sudo apt install -y docker.io`
- [ ] Install Docker Compose: `sudo apt install -y docker-compose`
- [ ] Start Docker service: `sudo systemctl start docker && sudo systemctl enable docker`
- [ ] Add ubuntu user to docker group: `sudo usermod -aG docker ubuntu`
- [ ] Log out and back in for group changes to take effect
- [ ] Test Docker: `docker --version && docker-compose --version`

### ✅ Database Setup (Choose One)

#### Option A: Local PostgreSQL (Docker)
- [ ] Database will be created automatically by docker-compose
- [ ] Set `DATABASE_URL=postgresql://postgres:postgres@db:5432/pbsports` in secrets

#### Option B: AWS RDS PostgreSQL
- [ ] Create RDS PostgreSQL instance
- [ ] Configure security group for database access from EC2
- [ ] Note connection string for `DATABASE_URL` secret
- [ ] Test connection from EC2 instance

### ✅ GitHub Repository Configuration

#### Required Secrets (Settings → Secrets and variables → Actions)

- [ ] `EC2_HOST`: Your EC2 public IP address
- [ ] `EC2_USER`: SSH username (usually `ubuntu`)
- [ ] `EC2_SSH_KEY`: Complete private SSH key content (including headers)
- [ ] `DATABASE_URL`: PostgreSQL connection string
- [ ] `JWT_SECRET`: Secure random string (generate with `openssl rand -base64 32`)
- [ ] `LEAGUE_SLUG`: Default league identifier (e.g., `pbsports`)

#### SSH Key Setup

- [ ] Generate SSH key pair: `ssh-keygen -t rsa -b 4096 -C "github-actions"`
- [ ] Copy public key to EC2: `ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@your-ec2-ip`
- [ ] Add private key content to `EC2_SSH_KEY` GitHub secret
- [ ] Test SSH connection without password prompt

## Deployment Validation

### ✅ Local Testing

- [ ] Run validation script: `./scripts/validate-deployment.sh`
- [ ] Ensure all tests pass: `npm test`
- [ ] Verify build works: `npm run build`
- [ ] Check linting: `npm run lint`
- [ ] Test Docker build locally: `docker-compose build`

### ✅ GitHub Actions Workflow

- [ ] Commit and push changes to a feature branch
- [ ] Create pull request to trigger test workflow
- [ ] Verify all tests pass in GitHub Actions
- [ ] Merge to main branch to trigger deployment workflow

## Deployment Process

### ✅ Automatic Deployment

- [ ] Push to main branch triggers deployment
- [ ] Monitor GitHub Actions workflow progress
- [ ] Check "Test" job completes successfully
- [ ] Check "Deploy" job completes successfully
- [ ] Verify health checks pass

### ✅ Manual Verification

- [ ] SSH to EC2 instance: `ssh ubuntu@your-ec2-ip`
- [ ] Navigate to deployment: `cd /home/ubuntu/pbsportsclub-api/current`
- [ ] Check container status: `docker-compose ps`
- [ ] View logs: `docker-compose logs api`
- [ ] Run health check: `./scripts/health-check.sh`

### ✅ API Testing

- [ ] Test health endpoint: `curl http://your-ec2-ip:3000/health`
- [ ] Test public endpoint: `curl http://your-ec2-ip:3000/public/leagues/pbsports`
- [ ] Test documentation: Visit `http://your-ec2-ip:3000/docs`
- [ ] Test signup endpoint: 
  ```bash
  curl -X POST http://your-ec2-ip:3000/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
  ```

## Post-Deployment

### ✅ Monitoring Setup

- [ ] Verify application logs are being generated
- [ ] Check database connectivity and data
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Set up CloudWatch monitoring (optional)

### ✅ Security Hardening

- [ ] Change default database passwords
- [ ] Configure firewall rules (ufw)
- [ ] Set up SSL/TLS certificate (Let's Encrypt)
- [ ] Configure reverse proxy (nginx) - optional
- [ ] Enable automatic security updates

### ✅ Backup Strategy

- [ ] Set up automated database backups
- [ ] Document backup and restore procedures
- [ ] Test backup restoration process
- [ ] Configure backup retention policy

## Troubleshooting

### ✅ Common Issues

#### Deployment Fails
- [ ] Check GitHub Actions logs for error details
- [ ] Verify all secrets are correctly configured
- [ ] Ensure EC2 instance is running and accessible
- [ ] Check SSH key permissions and format

#### Health Checks Fail
- [ ] SSH to server and check container logs: `docker-compose logs`
- [ ] Verify environment variables are set correctly
- [ ] Check database connectivity
- [ ] Ensure ports are open in security groups

#### Application Not Accessible
- [ ] Verify security group allows inbound traffic on port 3000
- [ ] Check if containers are running: `docker-compose ps`
- [ ] Test local connectivity: `curl localhost:3000/health` from EC2
- [ ] Check application logs for errors

#### Database Issues
- [ ] Verify DATABASE_URL format and credentials
- [ ] Check if database migrations ran successfully
- [ ] Test database connection manually
- [ ] Review database container logs

### ✅ Emergency Procedures

#### Rollback Deployment
- [ ] SSH to EC2 instance
- [ ] Navigate to deployment directory
- [ ] Stop current containers: `docker-compose down`
- [ ] Restore backup: `mv backup current` (if backup exists)
- [ ] Start previous version: `cd current && docker-compose up -d`

#### Manual Deployment
- [ ] Build application locally: `npm run build`
- [ ] Create deployment package: `tar -czf deployment.tar.gz dist package*.json prisma docker-compose.yml Dockerfile scripts/`
- [ ] Copy to server: `scp deployment.tar.gz ubuntu@your-ec2-ip:/home/ubuntu/`
- [ ] SSH and deploy manually using deployment scripts

## Success Criteria

### ✅ Deployment Complete

- [ ] GitHub Actions workflow shows successful deployment
- [ ] Health check endpoint returns 200 status
- [ ] API documentation is accessible
- [ ] Database is seeded with initial data
- [ ] All containers are running and healthy
- [ ] Application responds to test requests
- [ ] Logs show no critical errors

### ✅ Production Ready

- [ ] SSL certificate configured (if applicable)
- [ ] Monitoring and alerting set up
- [ ] Backup procedures tested
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Rollback procedure tested

## Maintenance

### ✅ Regular Tasks

- [ ] Monitor application performance and logs
- [ ] Update dependencies regularly
- [ ] Rotate secrets and credentials
- [ ] Review and update security configurations
- [ ] Test backup and restore procedures
- [ ] Monitor resource usage and scale as needed

### ✅ Updates and Changes

- [ ] Use feature branches for development
- [ ] Test changes in staging environment (if available)
- [ ] Deploy during maintenance windows
- [ ] Monitor deployment success and application health
- [ ] Document any configuration changes

---

## Quick Reference

### Useful Commands

```bash
# SSH to server
ssh ubuntu@your-ec2-ip

# Check deployment status
cd /home/ubuntu/pbsportsclub-api/current
docker-compose ps
./scripts/health-check.sh

# View logs
docker-compose logs api
docker-compose logs db

# Restart services
docker-compose restart api
docker-compose restart db

# Update deployment
git push origin main  # Triggers automatic deployment

# Manual health check
curl http://your-ec2-ip:3000/health
```

### Important URLs

- API Health: `http://your-ec2-ip:3000/health`
- API Documentation: `http://your-ec2-ip:3000/docs`
- Public League: `http://your-ec2-ip:3000/public/leagues/pbsports`
- GitHub Actions: `https://github.com/your-username/your-repo/actions`
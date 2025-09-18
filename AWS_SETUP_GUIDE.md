# AWS Deployment Setup Guide

This guide walks you through configuring your PBSportsClub API for deployment on AWS EC2 with Aurora PostgreSQL.

## Prerequisites

- AWS Aurora PostgreSQL cluster running
- EC2 instance with Node.js installed
- AWS Secrets Manager secret for database credentials (recommended)
- Security groups configured for database and web access

## Step 1: Configure Environment Variables

### Option A: Using AWS Secrets Manager (Recommended)

1. **Copy the AWS environment template:**
   ```bash
   cp .env.aws.production .env.production.local
   ```

2. **Edit `.env.production.local` with your AWS details:**

   ```bash
   # Database Configuration
   AWS_SECRET_ARN="arn:aws:secretsmanager:us-east-1:123456789012:secret:aurora-credentials-AbCdEf"
   AWS_REGION="us-east-1"
   DB_NAME="pbsports"
   
   # Server Configuration
   NODE_ENV="production"
   PORT=3000
   
   # Generate a strong JWT secret
   JWT_SECRET="$(openssl rand -base64 64)"
   
   # Your frontend domain
   FRONTEND_URL="https://your-domain.com"
   
   # League settings
   LEAGUE_SLUG="your-league-slug"
   LEAGUE_NAME="Your League Name"
   LEAGUE_SEASON="Current Season"
   ```

### Option B: Direct Database Connection

If not using Secrets Manager, configure direct connection:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@your-aurora-cluster.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/pbsports"

# Or use individual components
DB_HOST="your-aurora-cluster.cluster-xxxxx.us-east-1.rds.amazonaws.com"
DB_PORT=5432
DB_NAME="pbsports"
DB_USERNAME="your_username"
DB_PASSWORD="your_secure_password"
```

## Step 2: AWS Secrets Manager Setup (If Using)

### Create Aurora Secret in Secrets Manager

1. **Go to AWS Secrets Manager Console**
2. **Create New Secret:**
   - Secret type: "Credentials for Amazon RDS database"
   - Select your Aurora cluster
   - Enter username and password
   - Name: `aurora-pbsports-credentials`

3. **Copy the Secret ARN** and add to your `.env.production.local`:
   ```bash
   AWS_SECRET_ARN="arn:aws:secretsmanager:region:account:secret:aurora-pbsports-credentials-AbCdEf"
   ```

### Install AWS SDK Dependencies

```bash
npm install @aws-sdk/client-secrets-manager
```

## Step 3: EC2 Instance Configuration

### Install Required Software

```bash
# Update system
sudo yum update -y

# Install Node.js (if not already installed)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git (if not already installed)
sudo yum install -y git

# Install Nginx (optional, for reverse proxy)
sudo amazon-linux-extras install nginx1 -y
```

### Configure IAM Role (For Secrets Manager Access)

1. **Create IAM Role** with these permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue"
         ],
         "Resource": "arn:aws:secretsmanager:region:account:secret:aurora-pbsports-credentials-*"
       }
     ]
   }
   ```

2. **Attach role to EC2 instance**

## Step 4: Security Group Configuration

### EC2 Security Group

Allow these inbound rules:
- **HTTP (80)**: 0.0.0.0/0 (for web access)
- **HTTPS (443)**: 0.0.0.0/0 (if using SSL)
- **SSH (22)**: Your IP address (for management)
- **Custom (3000)**: 0.0.0.0/0 (if not using Nginx proxy)

### Aurora Security Group

Allow these inbound rules:
- **PostgreSQL (5432)**: EC2 security group ID

## Step 5: Deploy Application

### Clone and Setup

```bash
# Clone your repository
git clone https://github.com/your-username/pbsportsclub-api.git
cd pbsportsclub-api

# Copy your configured environment file
# (Upload .env.production.local to the server)

# Make deployment script executable
chmod +x scripts/deploy-aws.sh

# Run deployment
./scripts/deploy-aws.sh deploy
```

### Manual Deployment Steps

If you prefer manual deployment:

```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate:deploy

# Seed database (optional)
npm run db:seed

# Start application
npm start
```

## Step 6: Process Management with PM2 (Alternative to systemd)

### Install PM2

```bash
npm install -g pm2
```

### Create PM2 Ecosystem File

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pbsportsclub-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production.local',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Step 7: SSL/HTTPS Setup (Optional)

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: Monitoring and Logging

### CloudWatch Logs (Optional)

1. **Install CloudWatch agent:**
   ```bash
   sudo yum install -y amazon-cloudwatch-agent
   ```

2. **Configure log forwarding:**
   ```json
   {
     "logs": {
       "logs_collected": {
         "files": {
           "collect_list": [
             {
               "file_path": "/opt/pbsportsclub-api/logs/combined.log",
               "log_group_name": "/aws/ec2/pbsportsclub-api",
               "log_stream_name": "{instance_id}"
             }
           ]
         }
       }
     }
   }
   ```

### Health Monitoring

Set up health checks:
- **Application Load Balancer**: Health check on `/health`
- **CloudWatch Alarms**: Monitor CPU, memory, response time
- **Route 53 Health Checks**: Monitor endpoint availability

## Step 9: Backup Strategy

### Database Backups

Aurora automatically creates backups, but you can also:

```bash
# Manual backup
pg_dump -h your-aurora-endpoint -U username -d pbsports > backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h $DB_HOST -U $DB_USERNAME -d $DB_NAME > /backups/pbsports_$DATE.sql
```

### Application Backups

```bash
# Backup application and configuration
tar -czf /backups/app_backup_$(date +%Y%m%d).tar.gz /opt/pbsportsclub-api
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Test connection
   psql -h your-aurora-endpoint -U username -d pbsports
   
   # Check security groups
   # Verify Aurora is in same VPC as EC2
   ```

2. **Secrets Manager Access Denied**
   ```bash
   # Check IAM role permissions
   aws sts get-caller-identity
   aws secretsmanager get-secret-value --secret-id your-secret-arn
   ```

3. **Application Won't Start**
   ```bash
   # Check logs
   sudo journalctl -u pbsportsclub-api -f
   
   # Or with PM2
   pm2 logs pbsportsclub-api
   ```

### Useful Commands

```bash
# Service management
sudo systemctl status pbsportsclub-api
sudo systemctl restart pbsportsclub-api
sudo journalctl -u pbsportsclub-api -f

# PM2 management
pm2 status
pm2 restart pbsportsclub-api
pm2 logs pbsportsclub-api

# Database operations
npm run db:migrate:deploy
npm run db:seed
npm run db:studio  # Prisma Studio (development only)

# Health check
curl http://localhost:3000/health
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificate installed
- [ ] Security groups configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Log rotation configured
- [ ] Health checks working
- [ ] Performance testing completed
- [ ] Documentation updated
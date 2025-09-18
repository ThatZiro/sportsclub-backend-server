#!/bin/bash

# AWS EC2 Deployment Script for PBSportsClub API
# This script deploys the API to an EC2 instance with Aurora PostgreSQL

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.aws.production"
APP_DIR="/opt/pbsportsclub-api"
SERVICE_NAME="pbsportsclub-api"
USER="ec2-user"  # Change to ubuntu for Ubuntu instances

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_aws_requirements() {
    log_info "Checking AWS deployment requirements..."
    
    # Check if we're on EC2
    if ! curl -s --max-time 3 http://169.254.169.254/latest/meta-data/instance-id > /dev/null; then
        log_warning "Not running on EC2 instance. This script is designed for EC2 deployment."
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "AWS environment file not found: $ENV_FILE"
        log_info "Please create and configure $ENV_FILE with your AWS settings."
        exit 1
    fi
    
    # Check if AWS CLI is available (optional but recommended)
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found. Consider installing it for better AWS integration."
    fi
    
    log_success "AWS requirements check completed"
}

install_dependencies() {
    log_info "Installing application dependencies..."
    
    # Install production dependencies
    npm ci --only=production
    
    # Install development dependencies for build
    npm ci
    
    log_success "Dependencies installed"
}

build_application() {
    log_info "Building application..."
    
    # Build TypeScript
    npm run build
    
    # Generate Prisma client
    npm run db:generate
    
    log_success "Application built successfully"
}

setup_database() {
    log_info "Setting up database connection..."
    
    # Load environment variables
    source "$ENV_FILE"
    
    # Test database connection
    if npm run db:migrate:deploy; then
        log_success "Database migrations completed"
    else
        log_error "Database migration failed. Check your Aurora connection settings."
        exit 1
    fi
    
    # Seed database if needed
    if [ "${SEED_DATABASE:-false}" = "true" ]; then
        log_info "Seeding database..."
        npm run db:seed
        log_success "Database seeded"
    fi
}

create_systemd_service() {
    log_info "Creating systemd service..."
    
    # Create systemd service file
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=PBSportsClub API Server
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/${ENV_FILE}
ExecStart=/usr/bin/node ${APP_DIR}/dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=${SERVICE_NAME}

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}
    
    log_success "Systemd service created and enabled"
}

start_service() {
    log_info "Starting API service..."
    
    # Start the service
    sudo systemctl start ${SERVICE_NAME}
    
    # Wait a moment for startup
    sleep 5
    
    # Check service status
    if sudo systemctl is-active --quiet ${SERVICE_NAME}; then
        log_success "API service started successfully"
    else
        log_error "Failed to start API service"
        sudo systemctl status ${SERVICE_NAME}
        exit 1
    fi
}

setup_nginx() {
    log_info "Setting up Nginx reverse proxy..."
    
    # Check if Nginx is installed
    if ! command -v nginx &> /dev/null; then
        log_warning "Nginx not installed. Installing..."
        sudo yum update -y
        sudo amazon-linux-extras install nginx1 -y
    fi
    
    # Create Nginx configuration
    sudo tee /etc/nginx/conf.d/${SERVICE_NAME}.conf > /dev/null <<EOF
server {
    listen 80;
    server_name _;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # API proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

    # Test Nginx configuration
    sudo nginx -t
    
    # Enable and start Nginx
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    
    log_success "Nginx configured and started"
}

show_deployment_info() {
    log_info "Deployment completed successfully! 🎉"
    
    # Get instance public IP
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")
    
    echo ""
    log_success "🌐 API Endpoints:"
    echo "  Public IP: http://${PUBLIC_IP}"
    echo "  Health Check: http://${PUBLIC_IP}/health"
    echo "  API Documentation: http://${PUBLIC_IP}/docs"
    
    echo ""
    log_info "📊 Service Management:"
    echo "  Status: sudo systemctl status ${SERVICE_NAME}"
    echo "  Logs: sudo journalctl -u ${SERVICE_NAME} -f"
    echo "  Restart: sudo systemctl restart ${SERVICE_NAME}"
    
    echo ""
    log_info "🔧 Nginx Management:"
    echo "  Status: sudo systemctl status nginx"
    echo "  Reload: sudo systemctl reload nginx"
    echo "  Logs: sudo tail -f /var/log/nginx/access.log"
}

# Main deployment process
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "🚀 Starting AWS EC2 deployment..."
            check_aws_requirements
            install_dependencies
            build_application
            setup_database
            create_systemd_service
            start_service
            setup_nginx
            show_deployment_info
            ;;
        "update")
            log_info "🔄 Updating application..."
            install_dependencies
            build_application
            setup_database
            sudo systemctl restart ${SERVICE_NAME}
            log_success "Application updated and restarted"
            ;;
        "status")
            sudo systemctl status ${SERVICE_NAME}
            ;;
        "logs")
            sudo journalctl -u ${SERVICE_NAME} -f
            ;;
        "restart")
            log_info "Restarting service..."
            sudo systemctl restart ${SERVICE_NAME}
            log_success "Service restarted"
            ;;
        "stop")
            log_info "Stopping service..."
            sudo systemctl stop ${SERVICE_NAME}
            log_success "Service stopped"
            ;;
        *)
            echo "Usage: $0 {deploy|update|status|logs|restart|stop}"
            echo "  deploy  - Full deployment setup"
            echo "  update  - Update application code"
            echo "  status  - Show service status"
            echo "  logs    - Show service logs"
            echo "  restart - Restart service"
            echo "  stop    - Stop service"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
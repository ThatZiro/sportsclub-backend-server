#!/bin/bash

# PBSportsClub API Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production.local"

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

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Production environment file not found: $ENV_FILE"
        log_info "Creating from template..."
        cp .env.production "$ENV_FILE"
        log_warning "Please update $ENV_FILE with your production values before continuing."
        log_warning "Especially update JWT_SECRET and database passwords!"
        exit 1
    fi
    
    log_success "All requirements met"
}

build_images() {
    log_info "Building Docker images..."
    
    # Use docker-compose or docker compose based on availability
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD --env-file "$ENV_FILE" build --no-cache
    log_success "Docker images built successfully"
}

deploy_database() {
    log_info "Starting database service..."
    
    # Start only the database first
    $COMPOSE_CMD --env-file "$ENV_FILE" up -d db
    
    # Wait for database to be healthy
    log_info "Waiting for database to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if $COMPOSE_CMD --env-file "$ENV_FILE" ps db | grep -q "healthy"; then
            log_success "Database is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Database failed to start within timeout"
        exit 1
    fi
}

run_migrations() {
    log_info "Running database migrations and seeding..."
    
    # Run migrations using the migration profile
    $COMPOSE_CMD --env-file "$ENV_FILE" --profile migration up db-migrate
    
    # Clean up the migration container
    $COMPOSE_CMD --env-file "$ENV_FILE" --profile migration rm -f db-migrate
    
    log_success "Database migrations completed"
}

deploy_api() {
    log_info "Starting API service..."
    
    # Start the full stack
    $COMPOSE_CMD --env-file "$ENV_FILE" --profile full-stack up -d
    
    # Wait for API to be healthy
    log_info "Waiting for API to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if $COMPOSE_CMD --env-file "$ENV_FILE" ps api | grep -q "healthy"; then
            log_success "API is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "API failed to start within timeout"
        exit 1
    fi
}

show_status() {
    log_info "Deployment status:"
    $COMPOSE_CMD --env-file "$ENV_FILE" ps
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    log_info "API is available at: http://localhost:${API_PORT:-3000}"
    log_info "API Documentation: http://localhost:${API_PORT:-3000}/docs"
    log_info "Health Check: http://localhost:${API_PORT:-3000}/health"
}

cleanup() {
    log_info "Cleaning up..."
    $COMPOSE_CMD --env-file "$ENV_FILE" down --remove-orphans
    docker system prune -f
    log_success "Cleanup completed"
}

# Main deployment process
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "🚀 Starting PBSportsClub API deployment..."
            check_requirements
            build_images
            deploy_database
            run_migrations
            deploy_api
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "status")
            $COMPOSE_CMD --env-file "$ENV_FILE" ps
            ;;
        "logs")
            $COMPOSE_CMD --env-file "$ENV_FILE" logs -f "${2:-api}"
            ;;
        "restart")
            log_info "Restarting services..."
            $COMPOSE_CMD --env-file "$ENV_FILE" --profile full-stack restart
            log_success "Services restarted"
            ;;
        *)
            echo "Usage: $0 {deploy|cleanup|status|logs|restart}"
            echo "  deploy  - Full deployment (default)"
            echo "  cleanup - Stop and clean up all containers"
            echo "  status  - Show service status"
            echo "  logs    - Show service logs (optionally specify service name)"
            echo "  restart - Restart all services"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
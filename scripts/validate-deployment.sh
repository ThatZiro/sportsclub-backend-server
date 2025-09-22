#!/bin/bash

# Deployment Validation Script for PBSportsClub API
# This script validates that the application is ready for deployment

set -e

echo "🔍 Starting deployment validation..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
VALIDATION_ERRORS=0

# Function to print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "1. Checking Node.js and npm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
    
    if [[ "$NODE_VERSION" =~ ^v1[8-9]\. ]] || [[ "$NODE_VERSION" =~ ^v[2-9][0-9]\. ]]; then
        print_success "Node.js version is compatible (18+)"
    else
        print_error "Node.js version should be 18 or higher, found: $NODE_VERSION"
    fi
else
    print_error "Node.js is not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed"
fi

echo ""
echo "2. Checking project dependencies..."
if [ -f "package.json" ]; then
    print_success "package.json exists"
else
    print_error "package.json not found"
fi

if [ -f "package-lock.json" ]; then
    print_success "package-lock.json exists"
else
    print_warning "package-lock.json not found - consider running 'npm install'"
fi

if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
else
    print_warning "node_modules not found - run 'npm install' first"
fi

echo ""
echo "3. Checking environment configuration..."
if [ -f ".env.example" ]; then
    print_success ".env.example exists"
else
    print_error ".env.example not found"
fi

if [ -f ".env" ]; then
    print_success ".env file exists"
    
    # Check for required environment variables
    required_vars=("DATABASE_URL" "JWT_SECRET" "LEAGUE_SLUG")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env; then
            print_success "$var is configured in .env"
        else
            print_warning "$var not found in .env file"
        fi
    done
else
    print_warning ".env file not found - copy from .env.example and configure"
fi

echo ""
echo "4. Checking Prisma configuration..."
if [ -f "prisma/schema.prisma" ]; then
    print_success "Prisma schema exists"
else
    print_error "Prisma schema not found"
fi

if [ -d "prisma/migrations" ]; then
    migration_count=$(find prisma/migrations -name "*.sql" | wc -l)
    if [ "$migration_count" -gt 0 ]; then
        print_success "Database migrations exist ($migration_count files)"
    else
        print_warning "No migration files found"
    fi
else
    print_warning "Migrations directory not found"
fi

echo ""
echo "5. Checking Docker configuration..."
if [ -f "Dockerfile" ]; then
    print_success "Dockerfile exists"
else
    print_error "Dockerfile not found"
fi

if [ -f "docker-compose.yml" ]; then
    print_success "docker-compose.yml exists"
else
    print_error "docker-compose.yml not found"
fi

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
else
    print_warning "Docker not installed (required for deployment)"
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose is installed: $COMPOSE_VERSION"
else
    print_warning "Docker Compose not installed (required for deployment)"
fi

echo ""
echo "6. Checking deployment scripts..."
deployment_scripts=("scripts/deploy.sh" "scripts/health-check.sh")
for script in "${deployment_scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            print_success "$script exists and is executable"
        else
            print_warning "$script exists but is not executable - run 'chmod +x $script'"
        fi
    else
        print_error "$script not found"
    fi
done

echo ""
echo "7. Running code quality checks..."

# Check if we can build the project
if [ -d "node_modules" ]; then
    echo "Running TypeScript compilation..."
    if npm run build > /dev/null 2>&1; then
        print_success "TypeScript compilation successful"
    else
        print_error "TypeScript compilation failed - run 'npm run build' for details"
    fi
    
    echo "Running linting..."
    if npm run lint > /dev/null 2>&1; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found - run 'npm run lint' for details"
    fi
    
    echo "Checking test configuration..."
    if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ]; then
        print_success "Jest configuration found"
    else
        print_warning "Jest configuration not found"
    fi
    
    # Don't run tests here as they might require database setup
    print_warning "Tests not run in validation - run 'npm test' separately"
else
    print_warning "Skipping build checks - install dependencies first"
fi

echo ""
echo "8. Checking GitHub Actions configuration..."
if [ -f ".github/workflows/deploy.yml" ]; then
    print_success "GitHub Actions workflow exists"
else
    print_error "GitHub Actions workflow not found"
fi

echo ""
echo "=================================="
echo "🏁 Validation Summary"
echo "=================================="

if [ $VALIDATION_ERRORS -eq 0 ]; then
    print_success "All critical validations passed! ✨"
    echo ""
    echo "Your project is ready for deployment. Next steps:"
    echo "1. Set up AWS EC2 instance"
    echo "2. Configure GitHub secrets"
    echo "3. Push to main branch to trigger deployment"
    echo ""
    exit 0
else
    print_error "Found $VALIDATION_ERRORS critical issues that need to be resolved"
    echo ""
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi
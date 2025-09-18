#!/bin/bash

# Deployment Validation Script
# This script validates that all necessary files and configurations are in place for deployment

set -e

echo "🔍 Validating deployment configuration..."

# Check required files
REQUIRED_FILES=(
    "package.json"
    "Dockerfile"
    "docker-compose.yml"
    "prisma/schema.prisma"
    ".github/workflows/deploy.yml"
    "scripts/deploy.sh"
    "scripts/health-check.sh"
)

echo "📁 Checking required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
        exit 1
    fi
done

# Check if scripts are executable
echo "🔧 Checking script permissions..."
if [ -x "scripts/deploy.sh" ]; then
    echo "✅ scripts/deploy.sh is executable"
else
    echo "⚠️  Making scripts/deploy.sh executable"
    chmod +x scripts/deploy.sh
fi

if [ -x "scripts/health-check.sh" ]; then
    echo "✅ scripts/health-check.sh is executable"
else
    echo "⚠️  Making scripts/health-check.sh executable"
    chmod +x scripts/health-check.sh
fi

# Validate package.json scripts
echo "📦 Checking package.json scripts..."
REQUIRED_SCRIPTS=("build" "start" "test" "lint")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if npm run | grep -q "^  $script$"; then
        echo "✅ npm run $script"
    else
        echo "❌ npm run $script - MISSING"
        exit 1
    fi
done

# Check Docker configuration
echo "🐳 Validating Docker configuration..."
if docker --version > /dev/null 2>&1; then
    echo "✅ Docker is available"
else
    echo "⚠️  Docker not found (this is okay for CI/CD validation)"
fi

# Validate docker-compose.yml syntax
if command -v docker-compose > /dev/null 2>&1; then
    if docker-compose config > /dev/null 2>&1; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml has syntax errors"
        exit 1
    fi
else
    echo "⚠️  docker-compose not found (this is okay for CI/CD validation)"
fi

# Check environment file template
echo "🔐 Checking environment configuration..."
if [ -f ".env.example" ]; then
    echo "✅ .env.example exists"
    
    # Check for required environment variables
    REQUIRED_ENV_VARS=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if grep -q "^$var=" .env.example; then
            echo "✅ $var in .env.example"
        else
            echo "❌ $var missing from .env.example"
            exit 1
        fi
    done
else
    echo "❌ .env.example - MISSING"
    exit 1
fi

# Validate GitHub Actions workflow
echo "🚀 Validating GitHub Actions workflow..."
if [ -f ".github/workflows/deploy.yml" ]; then
    # Check for required secrets in workflow
    REQUIRED_SECRETS=("EC2_HOST" "EC2_USER" "EC2_SSH_KEY" "DATABASE_URL" "JWT_SECRET")
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if grep -q "\${{ secrets\.$secret }}" .github/workflows/deploy.yml; then
            echo "✅ $secret secret referenced in workflow"
        else
            echo "❌ $secret secret missing from workflow"
            exit 1
        fi
    done
else
    echo "❌ GitHub Actions workflow missing"
    exit 1
fi

# Check Prisma configuration
echo "🗄️  Validating Prisma configuration..."
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma schema exists"
    
    # Check if migrations directory exists
    if [ -d "prisma/migrations" ]; then
        echo "✅ Prisma migrations directory exists"
    else
        echo "⚠️  No migrations found (this might be okay for initial setup)"
    fi
else
    echo "❌ Prisma schema missing"
    exit 1
fi

# Validate TypeScript configuration
echo "📝 Checking TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
else
    echo "❌ tsconfig.json missing"
    exit 1
fi

# Check if build directory structure is correct
echo "🏗️  Validating build configuration..."
if npm run build > /dev/null 2>&1; then
    if [ -d "dist" ]; then
        echo "✅ Build creates dist directory"
        if [ -f "dist/index.js" ]; then
            echo "✅ Main entry point exists in build output"
        else
            echo "❌ Main entry point missing from build output"
            exit 1
        fi
    else
        echo "❌ Build does not create dist directory"
        exit 1
    fi
else
    echo "❌ Build command failed"
    exit 1
fi

# Summary
echo ""
echo "🎉 Deployment validation completed successfully!"
echo ""
echo "📋 Next steps for deployment:"
echo "1. Set up AWS EC2 instance with Ubuntu"
echo "2. Configure GitHub repository secrets:"
echo "   - EC2_HOST (your EC2 public IP)"
echo "   - EC2_USER (usually 'ubuntu')"
echo "   - EC2_SSH_KEY (private SSH key content)"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - JWT_SECRET (secure random string)"
echo "   - LEAGUE_SLUG (default league identifier)"
echo "3. Push to main branch to trigger deployment"
echo ""
echo "📖 See DEPLOYMENT.md for detailed setup instructions"
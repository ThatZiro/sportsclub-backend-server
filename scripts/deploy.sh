#!/bin/bash

# PBSportsClub API Deployment Script
# This script handles Docker-based deployment on AWS EC2

set -e

echo "Starting PBSportsClub API deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Stop existing containers if running
echo "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images to free up space
echo "Cleaning up old Docker images..."
docker image prune -f || true

# Build and start new containers
echo "Building and starting new containers..."
docker-compose build --no-cache

# Start the database first
echo "Starting database..."
docker-compose up -d db

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 15

# Run database migrations
echo "Running database migrations..."
docker-compose run --rm api npx prisma migrate deploy

# Seed the database if needed
echo "Seeding database..."
docker-compose run --rm api npm run seed || echo "Seeding skipped or failed (this is okay if data already exists)"

# Start the API server
echo "Starting API server..."
docker-compose up -d api

# Wait for services to be fully up
echo "Waiting for services to start..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment completed successfully!"
    echo "Services status:"
    docker-compose ps
else
    echo "❌ Deployment failed - containers are not running"
    docker-compose logs
    exit 1
fi

echo "🚀 PBSportsClub API is now running!"
echo "API URL: http://localhost:3000"
echo "Health check: http://localhost:3000/health"
echo "API Documentation: http://localhost:3000/docs"
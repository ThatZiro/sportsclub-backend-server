#!/bin/bash

# Health Check Script for PBSportsClub API
# This script verifies that the application is running correctly

set -e

API_URL="http://localhost:3000"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "Starting health check for PBSportsClub API..."

# Function to check if API is responding
check_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check database connectivity
check_database_health() {
    # Check if the API can connect to the database by testing a simple endpoint
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/public/leagues/pbsports" || echo "000")
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        # 200 means league exists, 404 means API is working but league not found - both are good
        return 0
    else
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    local api_status=$(docker-compose ps -q api | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null || echo "not_found")
    local db_status=$(docker-compose ps -q db | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null || echo "not_found")
    
    if [ "$api_status" = "running" ] && [ "$db_status" = "running" ]; then
        return 0
    else
        echo "Container status - API: $api_status, DB: $db_status"
        return 1
    fi
}

# Wait for API to be ready
echo "Checking if containers are running..."
if ! check_containers; then
    echo "❌ Containers are not running properly"
    docker-compose ps
    docker-compose logs --tail=50
    exit 1
fi

echo "✅ Containers are running"

# Wait for API health endpoint
echo "Waiting for API health endpoint..."
retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    if check_api_health; then
        echo "✅ API health endpoint is responding"
        break
    fi
    
    retry_count=$((retry_count + 1))
    echo "Attempt $retry_count/$MAX_RETRIES - API not ready yet, waiting..."
    sleep $RETRY_INTERVAL
done

if [ $retry_count -eq $MAX_RETRIES ]; then
    echo "❌ API health check failed after $MAX_RETRIES attempts"
    echo "Container logs:"
    docker-compose logs api --tail=50
    exit 1
fi

# Check database connectivity
echo "Checking database connectivity..."
retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    if check_database_health; then
        echo "✅ Database connectivity verified"
        break
    fi
    
    retry_count=$((retry_count + 1))
    echo "Attempt $retry_count/$MAX_RETRIES - Database not ready yet, waiting..."
    sleep $RETRY_INTERVAL
done

if [ $retry_count -eq $MAX_RETRIES ]; then
    echo "❌ Database connectivity check failed after $MAX_RETRIES attempts"
    echo "API logs:"
    docker-compose logs api --tail=50
    echo "Database logs:"
    docker-compose logs db --tail=50
    exit 1
fi

# Additional API endpoint tests
echo "Testing key API endpoints..."

# Test public endpoint (should work without auth)
public_response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/public/leagues/pbsports" || echo "000")
echo "Public endpoint test: $public_response"

# Test docs endpoint
docs_response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/docs" || echo "000")
echo "Documentation endpoint test: $docs_response"

# Test auth endpoint (should return 400 for missing data, not 500)
auth_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/signup" -H "Content-Type: application/json" -d '{}' || echo "000")
echo "Auth endpoint test: $auth_response"

if [ "$public_response" != "200" ] && [ "$public_response" != "404" ]; then
    echo "❌ Public endpoint health check failed"
    exit 1
fi

if [ "$docs_response" != "200" ]; then
    echo "⚠️  Documentation endpoint not responding (this may be okay)"
fi

if [ "$auth_response" != "400" ] && [ "$auth_response" != "422" ]; then
    echo "❌ Auth endpoint health check failed - expected 400/422 but got $auth_response"
    exit 1
fi

echo "🎉 All health checks passed!"
echo "✅ API is healthy and ready to serve requests"
echo "✅ Database connectivity verified"
echo "✅ Key endpoints are responding correctly"

# Display final status
echo ""
echo "=== Deployment Status ==="
echo "API URL: $API_URL"
echo "Health: $API_URL/health"
echo "Docs: $API_URL/docs"
echo "Public League: $API_URL/public/leagues/pbsports"
echo ""
docker-compose ps
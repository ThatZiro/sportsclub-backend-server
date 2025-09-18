#!/bin/bash

# Production Database Seeding Script
# This script seeds the production database with initial data

set -e

echo "🌱 Seeding production database..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

if [ -z "$LEAGUE_SLUG" ]; then
    echo "⚠️  Warning: LEAGUE_SLUG not set, using default 'pbsports'"
    export LEAGUE_SLUG="pbsports"
fi

# Run the seeding script
echo "📊 Running database seed..."
if npm run db:seed; then
    echo "✅ Database seeded successfully"
else
    echo "⚠️  Seeding failed or skipped (this might be okay if data already exists)"
fi

echo "🎉 Production seeding completed!"
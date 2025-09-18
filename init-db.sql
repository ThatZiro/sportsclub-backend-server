-- Initialize the pbsports database
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (though it should be created by POSTGRES_DB)
SELECT 'CREATE DATABASE pbsports'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pbsports')\gexec

-- Set up any initial database configuration if needed
-- (Currently no additional setup required)
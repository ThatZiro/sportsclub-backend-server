#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

async function dockerInit() {
  console.log('🐳 Starting Docker initialization...\n');

  try {
    // Step 1: Wait for database to be ready
    console.log('⏳ Waiting for database to be ready...');
    await waitForDatabase();
    console.log('✅ Database is ready\n');

    // Step 2: Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated\n');

    // Step 3: Run database migrations
    console.log('🗃️  Running database migrations...');
    await execAsync('npx prisma migrate deploy');
    console.log('✅ Database migrations completed\n');

    // Step 4: Seed the database
    console.log('🌱 Seeding database...');
    await execAsync('npx tsx src/scripts/seed.ts');
    console.log('✅ Database seeded successfully\n');

    console.log('🎉 Docker initialization completed successfully!');
  } catch (error) {
    console.error('❌ Docker initialization failed:', error);
    process.exit(1);
  }
}

async function waitForDatabase(maxRetries = 30, delay = 2000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await execAsync('npx prisma db execute --stdin <<< "SELECT 1;"');
      return;
    } catch (error) {
      console.log(
        `  Attempt ${i + 1}/${maxRetries}: Database not ready yet, waiting...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Database connection timeout');
}

// Run initialization if this script is executed directly
if (require.main === module) {
  dockerInit();
}

export { dockerInit };

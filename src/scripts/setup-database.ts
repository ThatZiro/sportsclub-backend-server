import { exec } from 'child_process';
import { promisify } from 'util';
import { validatePrismaSchema } from './validate-schema';
import { testDatabaseSetup } from './test-connection';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

async function setupDatabase() {
  console.log('🚀 Starting complete database setup...\n');

  try {
    // Step 1: Validate schema
    console.log('📋 Step 1: Validating Prisma schema...');
    const isSchemaValid = validatePrismaSchema();
    if (!isSchemaValid) {
      throw new Error('Schema validation failed');
    }
    console.log('✅ Schema validation passed\n');

    // Step 2: Generate Prisma client
    console.log('📦 Step 2: Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated\n');

    // Step 3: Test connection
    console.log('🔌 Step 3: Testing database connection...');
    await testDatabaseSetup();
    console.log('');

    // Step 4: Information about next steps
    console.log('📝 Next Steps:');
    console.log('  1. Start PostgreSQL database:');
    console.log('     npm run docker:db');
    console.log('');
    console.log('  2. Run database migrations:');
    console.log('     npm run db:migrate');
    console.log('');
    console.log('  3. Seed the database:');
    console.log('     npm run db:seed');
    console.log('');
    console.log('  Or run all steps at once:');
    console.log('     npm run db:setup');
    console.log('');
    console.log('🎉 Database setup configuration completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };
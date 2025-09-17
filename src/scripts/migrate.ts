import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated successfully');

    // Run migrations
    console.log('🗃️  Running database migrations...');
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    if (stderr && !stderr.includes('warning')) {
      console.error('❌ Migration error:', stderr);
      throw new Error(stderr);
    }
    
    console.log('✅ Migrations completed successfully');
    if (stdout) {
      console.log(stdout);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
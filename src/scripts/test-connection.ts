import { checkDatabaseConnection, prisma } from '../infrastructure/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseSetup() {
  console.log('🔌 Testing database setup...');
  console.log(
    `📍 Database URL: ${process.env['DATABASE_URL']?.replace(/:[^:@]*@/, ':***@')}`
  );

  try {
    // Test basic connection
    console.log('🔍 Testing database connection...');
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
      console.log('✅ Database connection successful');

      // Test Prisma client functionality
      console.log('🧪 Testing Prisma client...');

      // This will fail if database doesn't exist or migrations haven't run
      // but that's expected at this stage
      try {
        await prisma.user.findMany({ take: 1 });
        console.log('✅ Prisma client working (database tables exist)');
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('does not exist')
        ) {
          console.log(
            '⚠️  Database tables not yet created (migrations needed)'
          );
        } else {
          console.log('⚠️  Database exists but tables not accessible:', error);
        }
      }
    } else {
      console.log('❌ Database connection failed');
      console.log(
        '💡 Make sure PostgreSQL is running and DATABASE_URL is correct'
      );
    }
  } catch (error) {
    console.error('❌ Database setup test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testDatabaseSetup();
}

export { testDatabaseSetup };

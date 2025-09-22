import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Simple validation script to check Prisma schema syntax
 * This runs basic checks without requiring Prisma CLI
 */
function validatePrismaSchema(): boolean {
  try {
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    console.log('🔍 Validating Prisma schema...');

    // Check for required sections
    const requiredSections = [
      'generator client',
      'datasource db',
      'model User',
      'model League',
      'model Team',
      'model TeamMember',
      'enum UserRole',
      'enum MemberRole',
      'enum MemberStatus',
    ];

    const missingSection = requiredSections.find(
      section => !schemaContent.includes(section)
    );

    if (missingSection) {
      console.error(`❌ Missing required section: ${missingSection}`);
      return false;
    }

    // Check for required fields in User model
    const userModelMatch = schemaContent.match(/model User \{([\s\S]*?)\}/);
    if (!userModelMatch) {
      console.error('❌ User model not found or malformed');
      return false;
    }

    const userModel = userModelMatch[1];
    if (!userModel) {
      console.error('❌ User model content not found');
      return false;
    }

    const requiredUserFields = ['id', 'email', 'passwordHash', 'name', 'role'];
    const missingUserField = requiredUserFields.find(
      field => !userModel.includes(field)
    );

    if (missingUserField) {
      console.error(`❌ Missing required User field: ${missingUserField}`);
      return false;
    }

    // Check for unique constraints
    if (!schemaContent.includes('@unique')) {
      console.error('❌ No unique constraints found');
      return false;
    }

    // Check for relations
    if (!schemaContent.includes('@relation')) {
      console.error('❌ No relations found');
      return false;
    }

    // Check for cascade deletes
    if (!schemaContent.includes('onDelete: Cascade')) {
      console.error('❌ No cascade deletes found');
      return false;
    }

    console.log('✅ Prisma schema validation passed');
    console.log('📋 Schema includes:');
    console.log('  - All required models (User, League, Team, TeamMember)');
    console.log('  - All required enums (UserRole, MemberRole, MemberStatus)');
    console.log('  - Proper relations and constraints');
    console.log('  - Cascade delete configurations');
    console.log('  - Unique constraints for data integrity');

    return true;
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const isValid = validatePrismaSchema();
  process.exit(isValid ? 0 : 1);
}

export { validatePrismaSchema };

/**
 * Test Swagger Configuration
 * Validates that the Swagger specification is properly generated
 */

import { swaggerSpec } from '../config/swagger';

console.log('🔍 Testing Swagger Configuration...\n');

// Type assertion for swagger spec
const spec = swaggerSpec as any;

// Test basic spec properties
console.log('📋 API Information:');
console.log(`  Title: ${spec.info?.title}`);
console.log(`  Version: ${spec.info?.version}`);
console.log(`  Description: ${spec.info?.description}`);

// Test paths
const paths = Object.keys(spec.paths || {});
console.log(`\n🛣️  API Endpoints (${paths.length} total):`);
paths.forEach((path: string) => {
  const methods = Object.keys(spec.paths?.[path] || {});
  console.log(`  ${path}: ${methods.join(', ').toUpperCase()}`);
});

// Test components
const schemas = Object.keys(spec.components?.schemas || {});
console.log(`\n📦 Schemas (${schemas.length} total):`);
schemas.forEach((schema: string) => {
  console.log(`  - ${schema}`);
});

// Test tags
const tags = spec.tags || [];
console.log(`\n🏷️  Tags (${tags.length} total):`);
tags.forEach((tag: any) => {
  console.log(`  - ${tag.name}: ${tag.description}`);
});

console.log('\n✅ Swagger configuration test completed!');
console.log('📚 Documentation will be available at: /docs');
console.log('📄 OpenAPI spec will be available at: /docs.json');
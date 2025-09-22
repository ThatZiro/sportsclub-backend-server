#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

async function validateDocker(): Promise<void> {
  console.log('🐳 Validating Docker deployment setup...\n');

  const results: ValidationResult[] = [];

  // Test 1: Docker availability
  try {
    await execAsync('docker --version');
    results.push({
      name: 'Docker Installation',
      status: 'pass',
      message: 'Docker is installed and accessible',
    });
  } catch (error) {
    results.push({
      name: 'Docker Installation',
      status: 'fail',
      message: 'Docker is not installed or not accessible',
    });
  }

  // Test 2: Docker Compose availability
  try {
    try {
      await execAsync('docker-compose --version');
    } catch {
      await execAsync('docker compose version');
    }
    results.push({
      name: 'Docker Compose',
      status: 'pass',
      message: 'Docker Compose is available',
    });
  } catch (error) {
    results.push({
      name: 'Docker Compose',
      status: 'fail',
      message: 'Docker Compose is not available',
    });
  }

  // Test 3: Docker daemon running
  try {
    await execAsync('docker info');
    results.push({
      name: 'Docker Daemon',
      status: 'pass',
      message: 'Docker daemon is running',
    });
  } catch (error) {
    results.push({
      name: 'Docker Daemon',
      status: 'fail',
      message: 'Docker daemon is not running',
    });
  }

  // Test 4: Dockerfile exists and is valid
  try {
    await execAsync('docker build --dry-run -f Dockerfile .');
    results.push({
      name: 'Dockerfile Validation',
      status: 'pass',
      message: 'Dockerfile is valid',
    });
  } catch (error) {
    results.push({
      name: 'Dockerfile Validation',
      status: 'fail',
      message: 'Dockerfile has issues or is missing',
    });
  }

  // Test 5: docker-compose.yml validation
  try {
    await execAsync('docker-compose config');
    results.push({
      name: 'Docker Compose Config',
      status: 'pass',
      message: 'docker-compose.yml is valid',
    });
  } catch (error) {
    results.push({
      name: 'Docker Compose Config',
      status: 'fail',
      message: 'docker-compose.yml has validation errors',
    });
  }

  // Test 6: Environment file check
  const fs = require('fs');
  if (fs.existsSync('.env.production')) {
    results.push({
      name: 'Production Environment Template',
      status: 'pass',
      message: 'Production environment template exists',
    });
  } else {
    results.push({
      name: 'Production Environment Template',
      status: 'warning',
      message: 'Production environment template is missing',
    });
  }

  // Test 7: Deployment scripts
  if (
    fs.existsSync('scripts/deploy.sh') &&
    fs.existsSync('scripts/deploy.ps1')
  ) {
    results.push({
      name: 'Deployment Scripts',
      status: 'pass',
      message: 'Deployment scripts are available for both Unix and Windows',
    });
  } else {
    results.push({
      name: 'Deployment Scripts',
      status: 'warning',
      message: 'Some deployment scripts are missing',
    });
  }

  // Test 8: Database initialization script
  if (fs.existsSync('src/scripts/docker-init.ts')) {
    results.push({
      name: 'Database Initialization',
      status: 'pass',
      message: 'Database initialization script exists',
    });
  } else {
    results.push({
      name: 'Database Initialization',
      status: 'warning',
      message: 'Database initialization script is missing',
    });
  }

  // Display results
  console.log('📋 Validation Results:\n');

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  results.forEach(result => {
    const icon =
      result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);

    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warningCount++;
  });

  console.log('\n📊 Summary:');
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  ⚠️  Warnings: ${warningCount}`);

  if (failCount > 0) {
    console.log(
      '\n❌ Docker deployment validation failed. Please fix the issues above.'
    );
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('\n⚠️  Docker deployment validation passed with warnings.');
    console.log('   Consider addressing the warnings for optimal deployment.');
  } else {
    console.log('\n🎉 Docker deployment validation passed successfully!');
    console.log('   Your Docker setup is ready for deployment.');
  }
}

// Test API health if it's running
async function testApiHealth(port: number = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/health`, res => {
      if (res.statusCode === 200) {
        console.log('✅ API health check passed');
        resolve();
      } else {
        reject(
          new Error(`API health check failed with status ${res.statusCode}`)
        );
      }
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('API health check timeout'));
    });
  });
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateDocker().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { validateDocker, testApiHealth };

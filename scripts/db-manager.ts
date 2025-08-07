#!/usr/bin/env node

import { DatabaseManagementAgent } from '@/lib/db-management';
import * as readline from 'readline';
import { execSync } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const agent = new DatabaseManagementAgent();

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🗄️  Database Management Agent');
  console.log('================================');
  console.log();

  while (true) {
    console.log('Available commands:');
    console.log('1. health - Check database health');
    console.log('2. validate - Validate schema');
    console.log('3. migrate - Run pending migrations');
    console.log('4. seed - Generate seed data');
    console.log('5. clear - Clear all data (development)');
    console.log('6. backup - Create database backup');
    console.log('7. restore - Restore from backup');
    console.log('8. optimize - Get optimization recommendations');
    console.log('9. status - Show migration status');
    console.log('0. exit - Exit the agent');
    console.log();

    const choice = await askQuestion('Select an option (0-9): ');

    try {
      switch (choice.trim()) {
        case '1':
          await handleHealthCheck();
          break;
        case '2':
          await handleValidation();
          break;
        case '3':
          await handleMigration();
          break;
        case '4':
          await handleSeedData();
          break;
        case '5':
          await handleClearData();
          break;
        case '6':
          await handleBackup();
          break;
        case '7':
          await handleRestore();
          break;
        case '8':
          await handleOptimization();
          break;
        case '9':
          await handleStatus();
          break;
        case '0':
          console.log('Goodbye! 👋');
          rl.close();
          await agent.close();
          process.exit(0);
        default:
          console.log('Invalid option. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }
}

async function handleHealthCheck() {
  console.log('🔍 Running database health check...\n');
  const health = await agent.checkHealth();
  
  console.log('📊 Health Summary:');
  console.log(`Connection: ${health.connection ? '✅' : '❌'}`);
  console.log(`Latency: ${health.latency}ms`);
  console.log(`Version: ${health.version}`);
  console.log(`Database Size: ${health.size}`);
  console.log();

  console.log('📈 Table Statistics:');
  health.tableStats.forEach(table => {
    console.log(`  ${table.name}: ${table.rows} rows, ${table.size}`);
  });
  console.log();

  console.log('⚡ Performance Metrics:');
  console.log(`Cache Hit Ratio: ${health.performance.cacheHitRatio.toFixed(1)}%`);
  console.log(`Index Usage: ${health.performance.indexUsage.toFixed(1)}%`);
  console.log(`Sequential Scans: ${health.performance.sequentialScans}`);
  
  if (health.performance.longRunningQueries.length > 0) {
    console.log('\n⚠️  Long Running Queries:');
    health.performance.longRunningQueries.forEach(q => {
      console.log(`  ${q.duration}s - ${q.query.substring(0, 50)}...`);
    });
  }
}

async function handleValidation() {
  console.log('🔍 Validating database schema...\n');
  const result = await agent.validateSchema();
  
  if (result.valid) {
    console.log('✅ Schema validation passed!');
  } else {
    console.log('❌ Schema validation failed!');
    result.errors.forEach(error => console.log(`  Error: ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
  }

  if (result.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    result.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
  }
}

async function handleMigration() {
  console.log('🔄 Checking migration status...\n');
  const status = await agent.getMigrationStatus();
  
  console.log('📋 Migration Status:');
  console.log(`Current Version: ${status.currentVersion}`);
  console.log(`Latest Version: ${status.latestVersion}`);
  console.log(`Pending: ${status.pending.length}`);
  
  if (status.pending.length > 0) {
    console.log('\nPending migrations:');
    status.pending.forEach(migration => console.log(`  - ${migration}`));
    
    const confirm = await askQuestion('\nRun pending migrations? (y/N): ');
    if (confirm.toLowerCase() === 'y') {
      console.log('Running migrations...');
      const result = await agent.runMigrations();
      console.log(`✅ ${result.message}`);
    }
  } else {
    console.log('✅ All migrations are up to date!');
  }
}

async function handleSeedData() {
  console.log('🌱 Seed Data Generation');
  console.log('======================');
  
  const users = await askQuestion('Number of users (default 5): ');
  const projects = await askQuestion('Projects per user (default 10): ');
  const templates = await askQuestion('Number of templates (default 20): ');
  
  const options = {
    users: parseInt(users) || 5,
    projectsPerUser: parseInt(projects) || 10,
    templates: parseInt(templates) || 20,
  };

  const confirm = await askQuestion(`\nGenerate ${options.users} users, ${options.users * options.projectsPerUser} projects, and ${options.templates} templates? (y/N): `);
  
  if (confirm.toLowerCase() === 'y') {
    console.log('Generating seed data...');
    const result = await agent.generateSeedData(options);
    console.log(`✅ ${result.message}`);
  }
}

async function handleClearData() {
  const confirm = await askQuestion('⚠️  This will delete ALL data. Are you sure? (y/N): ');
  
  if (confirm.toLowerCase() === 'y') {
    const doubleConfirm = await askQuestion('Type "DELETE" to confirm: ');
    
    if (doubleConfirm === 'DELETE') {
      console.log('Clearing all data...');
      const result = await agent.clearAllData();
      console.log(`✅ ${result.message}`);
    } else {
      console.log('Cancelled');
    }
  }
}

async function handleBackup() {
  console.log('💾 Database Backup');
  console.log('==================');
  
  const filename = await askQuestion('Backup filename (optional): ');
  const useFilename = filename.trim() || undefined;
  
  console.log('Creating backup...');
  const result = await agent.createBackup(useFilename);
  console.log(`✅ ${result.message}`);
  console.log(`File: ${result.file}`);
  console.log(`Size: ${result.size}`);
}

async function handleRestore() {
  console.log('📁 Database Restore');
  console.log('===================');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      console.log('No backups directory found');
      return;
    }
    
    const backups = fs.readdirSync(backupDir).filter((f: string) => f.endsWith('.sql'));
    
    if (backups.length === 0) {
      console.log('No backup files found');
      return;
    }
    
    console.log('Available backups:');
    backups.forEach((backup: string, index: number) => {
      console.log(`${index + 1}. ${backup}`);
    });
    
    const choice = await askQuestion('Select backup to restore (number): ');
    const index = parseInt(choice) - 1;
    
    if (index >= 0 && index < backups.length) {
      const backupFile = backups[index];
      const confirm = await askQuestion(`Restore from ${backupFile}? (y/N): `);
      
      if (confirm.toLowerCase() === 'y') {
        console.log('Restoring database...');
        const result = await agent.restoreBackup(backupFile);
        console.log(`✅ ${result.message}`);
      }
    } else {
      console.log('Invalid selection');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function handleOptimization() {
  console.log('🚀 Optimization Recommendations');
  console.log('================================');
  
  const recommendations = await agent.getOptimizationRecommendations();
  
  if (recommendations.length === 0) {
    console.log('✅ No optimization recommendations at this time');
  } else {
    console.log('Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

async function handleStatus() {
  console.log('📊 Migration Status');
  console.log('===================');
  
  const status = await agent.getMigrationStatus();
  
  console.log(`Current Version: ${status.currentVersion}`);
  console.log(`Latest Version: ${status.latestVersion}`);
  console.log(`Applied: ${status.applied.length} migrations`);
  console.log(`Pending: ${status.pending.length} migrations`);
  
  if (status.applied.length > 0) {
    console.log('\nApplied migrations:');
    status.applied.forEach(migration => console.log(`  ✓ ${migration}`));
  }
  
  if (status.pending.length > 0) {
    console.log('\nPending migrations:');
    status.pending.forEach(migration => console.log(`  ⚠️  ${migration}`));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  rl.close();
  agent.close().then(() => {
    process.exit(0);
  });
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as dbManagerCli };
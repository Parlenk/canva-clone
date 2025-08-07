#!/usr/bin/env node

/**
 * Database Health Check Script
 * Quick health check for CI/CD and monitoring
 */

import { DatabaseManagementAgent } from '@/lib/db-management';

async function runHealthCheck() {
  const agent = new DatabaseManagementAgent();
  
  try {
    console.log('🔍 Running database health check...\n');
    
    const health = await agent.checkHealth();
    
    // Exit codes for CI/CD
    const issues = [];
    
    if (!health.connection) {
      issues.push('Database connection failed');
    }
    
    if (health.latency > 1000) {
      issues.push(`High latency: ${health.latency}ms`);
    }
    
    if (health.performance.cacheHitRatio < 80) {
      issues.push(`Low cache hit ratio: ${health.performance.cacheHitRatio.toFixed(1)}%`);
    }
    
    if (health.performance.indexUsage < 70) {
      issues.push(`Low index usage: ${health.performance.indexUsage.toFixed(1)}%`);
    }
    
    // Summary
    console.log('📊 Health Check Summary:');
    console.log(`Connection: ${health.connection ? '✅' : '❌'}`);
    console.log(`Latency: ${health.latency}ms`);
    console.log(`Database Size: ${health.size}`);
    console.log(`Cache Hit Ratio: ${health.performance.cacheHitRatio.toFixed(1)}%`);
    console.log(`Index Usage: ${health.performance.indexUsage.toFixed(1)}%`);
    console.log(`Total Tables: ${health.tableStats.length}`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      process.exit(1);
    }
    
    console.log('\n✅ All health checks passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await agent.close();
  }
}

// Run if called directly
if (require.main === module) {
  runHealthCheck();
}
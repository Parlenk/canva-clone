#!/usr/bin/env node

/**
 * Database Seed Script
 * Generate comprehensive test data for development
 */

import { DatabaseManagementAgent } from '@/lib/db-management';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  const agent = new DatabaseManagementAgent();
  
  try {
    console.log('🌱 Database Seed Generator');
    console.log('==========================\n');
    
    // Check if database is empty
    const health = await agent.checkHealth();
    const hasData = health.tableStats.some(t => t.rows > 0);
    
    if (hasData) {
      console.log('⚠️  Database already contains data');
      const clearConfirm = await askQuestion('Clear existing data first? (y/N): ');
      
      if (clearConfirm.toLowerCase() === 'y') {
        const doubleConfirm = await askQuestion('Type "CLEAR" to confirm: ');
        if (doubleConfirm === 'CLEAR') {
          console.log('Clearing existing data...');
          await agent.clearAllData();
          console.log('✅ Data cleared');
        } else {
          console.log('Cancelled');
          rl.close();
          await agent.close();
          return;
        }
      }
    }
    
    // Get seed options
    console.log('\n📊 Seed Options:');
    
    const users = await askQuestion('Number of users (5): ');
    const projects = await askQuestion('Projects per user (10): ');
    const templates = await askQuestion('Templates (20): ');
    const includeAI = await askQuestion('Include AI training data? (y/N): ');
    
    const options = {
      users: parseInt(users) || 5,
      projectsPerUser: parseInt(projects) || 10,
      templates: parseInt(templates) || 20,
      includeAI: includeAI.toLowerCase() === 'y',
    };
    
    console.log('\n🎯 Seed Configuration:');
    console.log(`Users: ${options.users}`);
    console.log(`Projects: ${options.users * options.projectsPerUser}`);
    console.log(`Templates: ${options.templates}`);
    console.log(`AI Data: ${options.includeAI ? 'Yes' : 'No'}`);
    
    const confirm = await askQuestion('\nProceed with seeding? (y/N): ');
    
    if (confirm.toLowerCase() === 'y') {
      console.log('\n🚀 Generating seed data...\n');
      
      // Generate basic data
      const result = await agent.generateSeedData({
        users: options.users,
        projectsPerUser: options.projectsPerUser,
        templates: options.templates,
      });
      
      console.log(`✅ ${result.message}`);
      
      // Generate AI training data if requested
      if (options.includeAI) {
        console.log('📊 Generating AI training data...');
        await generateAITrainingData(agent, result.userIds, result.projectIds);
        console.log('✅ AI training data generated');
      }
      
      // Final health check
      const finalHealth = await agent.checkHealth();
      console.log('\n📈 Final Database State:');
      console.log(`Total Users: ${finalHealth.tableStats.find(t => t.name === 'public.user')?.rows || 0}`);
      console.log(`Total Projects: ${finalHealth.tableStats.find(t => t.name === 'public.project')?.rows || 0}`);
      console.log(`Database Size: ${finalHealth.size}`);
      
    } else {
      console.log('Seeding cancelled');
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    rl.close();
    await agent.close();
  }
}

async function generateAITrainingData(agent: DatabaseManagementAgent, userIds: string[], projectIds: string[]) {
  // This would generate realistic AI training data
  // For now, we'll create some sample resize sessions
  
  const { sql } = require('@neondatabase/serverless');
  const { createId } = require('@paralleldrive/cuid2');
  
  for (let i = 0; i < 50; i++) {
    const sessionId = createId();
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const projectId = projectIds[Math.floor(Math.random() * projectIds.length)];
    
    const originalCanvas = {
      width: 800,
      height: 600,
      objects: [
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 200,
          height: 200,
          fill: '#ff0000'
        }
      ]
    };
    
    const targetDimensions = {
      width: 1200,
      height: 800
    };
    
    const aiResult = {
      success: true,
      objects: [
        {
          type: 'rect',
          left: 150,
          top: 133,
          width: 300,
          height: 267,
          fill: '#ff0000'
        }
      ]
    };
    
    await sql`
      INSERT INTO resize_session (
        id, user_id, project_id, original_canvas, target_dimensions, 
        ai_result, user_rating, processing_time, created_at, updated_at
      )
      VALUES (
        ${sessionId},
        ${userId},
        ${projectId},
        ${JSON.stringify(originalCanvas)},
        ${JSON.stringify(targetDimensions)},
        ${JSON.stringify(aiResult)},
        ${Math.floor(Math.random() * 5) + 1},
        ${Math.floor(Math.random() * 5000) + 500},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `;
  }
}

// Environment-specific configurations
const environments = {
  development: {
    users: 10,
    projectsPerUser: 20,
    templates: 30,
    includeAI: true,
  },
  staging: {
    users: 5,
    projectsPerUser: 10,
    templates: 15,
    includeAI: false,
  },
  production: {
    users: 0, // No seed data in production
    projectsPerUser: 0,
    templates: 0,
    includeAI: false,
  },
};

// Auto-seed for specific environments
if (process.env.NODE_ENV === 'development' && process.argv.includes('--auto')) {
  const agent = new DatabaseManagementAgent();
  
  (async () => {
    try {
      console.log('🚀 Auto-seeding development database...');
      await agent.generateSeedData(environments.development);
      console.log('✅ Development database seeded');
    } catch (error) {
      console.error('❌ Auto-seeding failed:', error);
      process.exit(1);
    } finally {
      await agent.close();
    }
  })();
} else if (require.main === module) {
  main();
}

export { main as seedDatabase };
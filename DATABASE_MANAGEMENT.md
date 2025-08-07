# Database Management Agent

A comprehensive database management system for the Canva clone project built with PostgreSQL and Drizzle ORM.

## Features

- **Database Health Monitoring**: Real-time connection checks, performance metrics, and resource usage
- **Schema Validation**: Automated validation against migrations and integrity checks
- **Migration Management**: Safe migration execution with rollback capabilities
- **Seed Data Generation**: Automated test data creation for development environments
- **Backup & Restore**: Full database backup and restore functionality
- **Performance Optimization**: Intelligent recommendations based on query analysis
- **Development Tools**: Data clearing, reset utilities, and environment setup

## Quick Start

### Using the CLI

```bash
# Make the CLI executable
chmod +x scripts/db-manager.ts

# Run the interactive CLI
npm run db:cli

# Or run directly with ts-node
npx ts-node scripts/db-manager.ts
```

### Available CLI Commands

1. **health** - Check database health and performance
2. **validate** - Validate schema against migrations
3. **migrate** - Run pending migrations
4. **seed** - Generate test data
5. **clear** - Clear all data (development only)
6. **backup** - Create database backup
7. **restore** - Restore from backup
8. **optimize** - Get optimization recommendations
9. **status** - Show migration status
0. **exit** - Exit the agent

### Programmatic Usage

```typescript
import { DatabaseManagementAgent } from '@/lib/db-management';

const agent = new DatabaseManagementAgent();

// Check database health
const health = await agent.checkHealth();
console.log(`Database health: ${health.connection ? 'OK' : 'FAILED'}`);

// Validate schema
const validation = await agent.validateSchema();
if (!validation.valid) {
  console.error('Schema validation failed:', validation.errors);
}

// Generate seed data
await agent.generateSeedData({
  users: 10,
  projectsPerUser: 5,
  templates: 15
});

// Close connection
await agent.close();
```

## Detailed Usage

### Database Health Check

```typescript
const health = await agent.checkHealth();

// Returns:
{
  connection: true,
  latency: 45,
  version: "PostgreSQL 15.3 on x86_64-pc-linux-gnu...",
  size: "1.2 GB",
  tableStats: [
    {
      name: "public.project",
      rows: 1500,
      size: "856 MB",
      lastAutoVacuum: "2024-01-15 10:30:00",
      lastAutoAnalyze: "2024-01-15 11:00:00"
    }
  ],
  indexes: [
    {
      table: "public.project",
      index: "project_user_id_idx",
      column: "user_id",
      size: "45 MB",
      scans: 1250
    }
  ],
  performance: {
    cacheHitRatio: 95.2,
    indexUsage: 87.5,
    sequentialScans: 12,
    longRunningQueries: [],
    bloat: []
  }
}
```

### Migration Management

```typescript
// Check migration status
const status = await agent.getMigrationStatus();
console.log(status);
// {
//   applied: ["0000_busy_scourge", "0001_cultured_beast"],
//   pending: ["0002_glossy_cloak"],
//   currentVersion: "0001_cultured_beast",
//   latestVersion: "0002_glossy_cloak"
// }

// Run pending migrations
const result = await agent.runMigrations();
console.log(result.message); // "Applied 1 migration(s)"
```

### Seed Data Generation

```typescript
// Generate comprehensive test data
await agent.generateSeedData({
  users: 50,              // Create 50 test users
  projectsPerUser: 20,    // 20 projects per user
  templates: 30           // 30 template projects
});

// Quick seed with defaults
await agent.generateSeedData(); // Uses: 5 users, 10 projects/user, 20 templates
```

Generated data includes:
- Users with secure passwords (password123)
- Projects with realistic canvas JSON data
- Template projects for common use cases
- Proper relationships between users and projects

### Backup and Restore

```typescript
// Create backup
const backup = await agent.createBackup('my-backup.sql');
console.log(`Backup created: ${backup.file} (${backup.size})`);

// List available backups
// (in CLI: use restore command to see available files)

// Restore from backup
const restore = await agent.restoreBackup('my-backup.sql');
console.log(restore.message);
```

### Performance Optimization

```typescript
// Get optimization recommendations
const recommendations = await agent.getOptimizationRecommendations();

recommendations.forEach(rec => {
  console.log(`💡 ${rec}`);
});

// Example output:
// 💡 Increase shared_buffers to improve cache hit ratio (currently 78.5%)
// 💡 Consider adding indexes for frequently queried columns (index usage: 65.2%)
// 💡 Run VACUUM ANALYZE on public.project (15.3% bloat)
```

## Database Schema

The agent manages the following schema:

### Core Tables
- **users** - User accounts and authentication
- **projects** - Design projects with canvas data
- **accounts** - NextAuth.js account linking
- **sessions** - User sessions
- **verification_tokens** - Email verification tokens
- **authenticators** - 2FA authenticators

### AI Training Tables
- **resize_sessions** - AI resize operation tracking
- **training_data** - ML training dataset

### Relationships
- Users → Projects (one-to-many)
- Users → Resize Sessions (one-to-many)
- Projects → Resize Sessions (one-to-many)
- Resize Sessions → Training Data (one-to-many)

## Environment Setup

### Required Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://user:password@host:port/database
```

### Installation

```bash
# Install dependencies
npm install

# Generate initial migration
npm run db:generate

# Run migrations
npm run db:migrate

# Start the management agent
npm run db:cli
```

## Development Commands

### Package.json Scripts

```json
{
  "scripts": {
    "db:cli": "ts-node scripts/db-manager.ts",
    "db:health": "ts-node -e \"import { DatabaseManagementAgent } from './src/lib/db-management'; new DatabaseManagementAgent().checkHealth().then(console.log)\"",
    "db:validate": "ts-node -e \"import { DatabaseManagementAgent } from './src/lib/db-management'; new DatabaseManagementAgent().validateSchema().then(console.log)\"",
    "db:seed": "ts-node -e \"import { DatabaseManagementAgent } from './src/lib/db-management'; new DatabaseManagementAgent().generateSeedData().then(console.log)\"",
    "db:backup": "ts-node -e \"import { DatabaseManagementAgent } from './src/lib/db-management'; new DatabaseManagementAgent().createBackup().then(console.log)\""
  }
}
```

### Common Workflows

#### Setting up a new development environment

```bash
# 1. Install dependencies
npm install

# 2. Run migrations
npm run db:migrate

# 3. Generate seed data
npm run db:seed

# 4. Verify everything works
npm run db:health
```

#### Production deployment checklist

```bash
# 1. Validate schema
npm run db:validate

# 2. Check for pending migrations
npm run db:cli
# Select "status" option

# 3. Create backup before deployment
npm run db:backup

# 4. Run migrations
npm run db:migrate

# 5. Verify health after deployment
npm run db:health
```

## Troubleshooting

### Common Issues

**Connection refused**
- Check DATABASE_URL in .env.local
- Verify PostgreSQL is running
- Check network connectivity to Neon

**Migration failures**
- Ensure all migrations are in the drizzle folder
- Check migration order in _journal.json
- Validate schema changes manually

**Permission errors**
- Ensure user has CREATE/DROP permissions
- Check ownership of database objects
- Verify pg_dump/psql are in PATH

**Performance issues**
- Run health check to identify bottlenecks
- Check for missing indexes
- Analyze query performance
- Review connection pooling settings

### Debug Mode

Enable verbose logging:

```bash
DEBUG=db:* npm run db:cli
```

## Security Considerations

- **Never run clear operations in production**
- **Always backup before migrations in production**
- **Use environment-specific configurations**
- **Restrict database permissions appropriately**
- **Monitor for unusual query patterns**

## API Reference

### DatabaseManagementAgent

#### Methods

- `checkHealth(): Promise<DatabaseHealth>` - Comprehensive health check
- `validateSchema(): Promise<ValidationResult>` - Schema validation
- `getMigrationStatus(): Promise<MigrationStatus>` - Migration status
- `runMigrations(): Promise<MigrationResult>` - Run pending migrations
- `generateSeedData(options?): Promise<SeedResult>` - Generate test data
- `clearAllData(): Promise<ClearResult>` - Clear all data
- `createBackup(filename?): Promise<BackupResult>` - Create backup
- `restoreBackup(filename): Promise<RestoreResult>` - Restore backup
- `getOptimizationRecommendations(): Promise<string[]>` - Get optimization tips
- `close(): Promise<void>` - Close database connection

#### Types

```typescript
interface DatabaseHealth {
  connection: boolean;
  latency: number;
  version: string;
  size: string;
  tableStats: TableStats[];
  indexes: IndexInfo[];
  performance: PerformanceMetrics;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface MigrationStatus {
  applied: string[];
  pending: string[];
  currentVersion: string;
  latestVersion: string;
}
```

## Contributing

When adding new database features:

1. Update the schema in `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Update validation logic in `validateSchema()`
4. Add seed data generation if needed
5. Test with the CLI tool
6. Update this documentation

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Run health checks to identify problems
3. Review logs and error messages
4. Create backups before making changes
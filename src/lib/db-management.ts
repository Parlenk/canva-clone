import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from 'dotenv';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

export interface DatabaseHealth {
  connection: boolean;
  latency: number;
  version: string;
  size: string;
  tableStats: TableStats[];
  indexes: IndexInfo[];
  performance: PerformanceMetrics;
}

export interface TableStats {
  name: string;
  rows: number;
  size: string;
  lastAutoVacuum: string | null;
  lastAutoAnalyze: string | null;
}

export interface IndexInfo {
  table: string;
  index: string;
  column: string;
  size: string;
  scans: number;
}

export interface PerformanceMetrics {
  cacheHitRatio: number;
  indexUsage: number;
  sequentialScans: number;
  longRunningQueries: QueryInfo[];
  bloat: BloatInfo[];
}

export interface QueryInfo {
  query: string;
  duration: string;
  state: string;
}

export interface BloatInfo {
  table: string;
  bloatPercentage: number;
  wastedBytes: string;
}

export interface MigrationStatus {
  applied: string[];
  pending: string[];
  currentVersion: string;
  latestVersion: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class DatabaseManagementAgent {
  private db;
  private sql;

  constructor() {
    this.sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle({ client: this.sql, schema });
  }

  /**
   * Check database health and performance
   */
  async checkHealth(): Promise<DatabaseHealth> {
    const start = Date.now();
    
    try {
      // Test connection
      await this.sql`SELECT 1`;
      const connection = true;
      const latency = Date.now() - start;

      // Get version
      const versionResult = await this.sql`SELECT version()`;
      const version = versionResult[0]?.version || 'Unknown';

      // Get database size
      const sizeResult = await this.sql`
        SELECT pg_database_size(current_database()) as size
      `;
      const size = this.formatBytes(parseInt(sizeResult[0]?.size || '0'));

      // Get table statistics
      const tableStats = await this.getTableStats();
      
      // Get index information
      const indexes = await this.getIndexInfo();
      
      // Get performance metrics
      const performance = await this.getPerformanceMetrics();

      return {
        connection,
        latency,
        version,
        size,
        tableStats,
        indexes,
        performance,
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error}`);
    }
  }

  /**
   * Get detailed table statistics
   */
  private async getTableStats(): Promise<TableStats[]> {
    const query = `
      SELECT 
        schemaname || '.' || relname as name,
        n_live_tup as rows,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size,
        last_vacuum as lastAutoVacuum,
        last_analyze as lastAutoAnalyze
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    `;
    
    const result = await this.sql.unsafe(query);
    // @ts-ignore - handle Drizzle query result format
    const rows = Array.isArray(result) ? result : [];
    return rows.map(row => ({
      name: row.name,
      rows: parseInt(row.rows),
      size: row.size,
      lastAutoVacuum: row.lastautovacuum,
      lastAutoAnalyze: row.lastautoanalyze,
    }));
  }

  /**
   * Get index information
   */
  private async getIndexInfo(): Promise<IndexInfo[]> {
    const query = `
      SELECT 
        schemaname || '.' || tablename as table,
        indexname as index,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size,
        idx_scan as scans
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC;
    `;
    
    const result = await this.sql.unsafe(query);
    // @ts-ignore - handle Drizzle query result format
    const rows = Array.isArray(result) ? result : [];
    return rows.map(row => ({
      table: row.table,
      index: row.index,
      column: '', // Would need to parse index definition
      size: row.size,
      scans: parseInt(row.scans),
    }));
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Cache hit ratio
    const cacheQuery = `
      SELECT 
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
      FROM pg_statio_user_tables;
    `;
    const cacheResult = await this.sql.unsafe(cacheQuery);
    // @ts-ignore - handle Drizzle query result format
    const cacheRows = Array.isArray(cacheResult) ? cacheResult : [];
    const cacheHitRatio = parseFloat(cacheRows[0]?.ratio || '0') * 100;

    // Index usage
    const indexQuery = `
      SELECT 
        sum(idx_scan) / (sum(seq_scan) + sum(idx_scan)) as usage
      FROM pg_stat_user_tables;
    `;
    const indexResult = await this.sql.unsafe(indexQuery);
    // @ts-ignore - handle Drizzle query result format
    const indexRows = Array.isArray(indexResult) ? indexResult : [];
    const indexUsage = parseFloat(indexRows[0]?.usage || '0') * 100;

    // Sequential scans
    const seqQuery = `
      SELECT sum(seq_scan) as scans FROM pg_stat_user_tables;
    `;
    const seqResult = await this.sql.unsafe(seqQuery);
    // @ts-ignore - handle Drizzle query result format
    const seqRows = Array.isArray(seqResult) ? seqResult : [];
    const sequentialScans = parseInt(seqRows[0]?.scans || '0');

    // Long running queries
    const longQuery = `
      SELECT 
        query,
        state,
        EXTRACT(EPOCH FROM (now() - query_start))::text as duration
      FROM pg_stat_activity
      WHERE state != 'idle'
      AND query_start < now() - interval '5 minutes'
      ORDER BY query_start;
    `;
    const longResult = await this.sql.unsafe(longQuery);
    // @ts-ignore - handle Drizzle query result format
    const longRows = Array.isArray(longResult) ? longResult : [];
    const longRunningQueries = longRows.map(row => ({
      query: row.query,
      duration: row.duration,
      state: row.state,
    }));

    // Table bloat
    const bloatQuery = `
      SELECT 
        schemaname || '.' || tablename as table,
        ROUND((bloat_size * 100 / table_size)::numeric, 2) as bloat_percentage,
        pg_size_pretty(bloat_size) as wasted_bytes
      FROM (
        SELECT 
          schemaname,
          tablename,
          cc.relpages * 8192 as table_size,
          (cc.relpages - (ceil((cc.reltuples * (datahdr + 8 + nullhdr + 4)) / 8192))) * 8192 as bloat_size
        FROM pg_class cc
        JOIN pg_namespace nn ON cc.relnamespace = nn.oid
        WHERE cc.relkind = 'r'
        AND nn.nspname NOT IN ('information_schema', 'pg_catalog')
      ) sub
      WHERE bloat_percentage > 10
      ORDER BY bloat_percentage DESC;
    `;
    const bloatResult = await this.sql.unsafe(bloatQuery);
    // @ts-ignore - handle Drizzle query result format
    const bloatRows = Array.isArray(bloatResult) ? bloatResult : [];
    const bloat = bloatRows.map(row => ({
      table: row.table,
      bloatPercentage: parseFloat(row.bloat_percentage),
      wastedBytes: row.wasted_bytes,
    }));

    return {
      cacheHitRatio,
      indexUsage,
      sequentialScans,
      longRunningQueries,
      bloat,
    };
  }

  /**
   * Validate database schema against migrations
   */
  async validateSchema(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check if all tables exist
      const tables = [
        'user', 'account', 'session', 'verificationToken', 'authenticator',
        'project', 'resize_session', 'training_data'
      ];

      for (const table of tables) {
        const exists = await this.sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          )
        `;
        if (!exists[0]?.exists) {
          errors.push(`Table '${table}' does not exist`);
        }
      }

      // Check foreign key constraints
      const fkCheck = await this.sql`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN (${tables.join(',')})
      `;

      // Check indexes
      const indexCheck = await this.sql`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN (${tables.join(',')})
      `;

      // Performance suggestions
      const performance = await this.getPerformanceMetrics();
      
      if (performance.cacheHitRatio < 80) {
        suggestions.push(`Cache hit ratio is ${performance.cacheHitRatio.toFixed(1)}%. Consider increasing shared_buffers.`);
      }

      if (performance.indexUsage < 70) {
        warnings.push(`Index usage is ${performance.indexUsage.toFixed(1)}%. Some queries may benefit from additional indexes.`);
      }

      if (performance.bloat.length > 0) {
        warnings.push(`${performance.bloat.length} tables have significant bloat (>10%). Consider running VACUUM ANALYZE.`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error}`],
        warnings: [],
        suggestions: [],
      };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    try {
      // Get applied migrations
      const appliedMigrations = await this.sql`
        SELECT id, checksum, executed_at
        FROM __drizzle_migrations
        ORDER BY executed_at ASC
      `;

      // Get all migration files from drizzle directory
      const fs = require('fs');
      const path = require('path');
      const drizzleDir = path.join(process.cwd(), 'drizzle');
      
      const migrationFiles = fs.readdirSync(drizzleDir)
        .filter((file: string) => file.endsWith('.sql') && !file.startsWith('meta'))
        .sort();

      const applied = appliedMigrations.map((m: any) => m.id);
      const all = migrationFiles.map((f: string) => f.replace('.sql', ''));
      const pending = all.filter((m: string) => !applied.includes(m));

      return {
        applied,
        pending,
        currentVersion: applied[applied.length - 1] || 'none',
        latestVersion: all[all.length - 1] || 'none',
      };
    } catch (error) {
      throw new Error(`Failed to get migration status: ${error}`);
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    try {
      const status = await this.getMigrationStatus();
      
      if (status.pending.length === 0) {
        return { message: 'No pending migrations', status };
      }

      await migrate(this.db, { migrationsFolder: './drizzle' });
      
      return {
        message: `Applied ${status.pending.length} migration(s)`,
        applied: status.pending,
      };
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  /**
   * Generate seed data for development
   */
  async generateSeedData(options: {
    users?: number;
    projectsPerUser?: number;
    templates?: number;
  } = {}) {
    const { users = 5, projectsPerUser = 10, templates = 20 } = options;

    try {
      const bcrypt = require('bcryptjs');
      const { createId } = require('@paralleldrive/cuid2');

      // Create users
      const userIds = [];
      for (let i = 0; i < users; i++) {
        const userId = createId();
        const email = `user${i + 1}@example.com`;
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await this.sql`
          INSERT INTO "user" (id, name, email, password)
          VALUES (${userId}, ${`User ${i + 1}`}, ${email}, ${hashedPassword})
        `;
        userIds.push(userId);
      }

      // Create projects for each user
      const projectIds = [];
      for (const userId of userIds) {
        for (let i = 0; i < projectsPerUser; i++) {
          const projectId = createId();
          const canvasJson = JSON.stringify({
            version: "5.3.0",
            objects: [
              {
                type: "rect",
                version: "5.3.0",
                originX: "left",
                originY: "top",
                left: 100,
                top: 100,
                width: 200,
                height: 200,
                fill: "#ff0000",
                stroke: null,
                strokeWidth: 1,
                strokeDashArray: null,
                strokeLineCap: "butt",
                strokeDashOffset: 0,
                strokeLineJoin: "miter",
                strokeUniform: false,
                strokeMiterLimit: 4,
                scaleX: 1,
                scaleY: 1,
                angle: 0,
                flipX: false,
                flipY: false,
                opacity: 1,
                shadow: null,
                visible: true,
                backgroundColor: "",
                fillRule: "nonzero",
                paintFirst: "fill",
                globalCompositeOperation: "source-over",
                skewX: 0,
                skewY: 0,
                rx: 0,
                ry: 0,
              }
            ],
            background: "#ffffff",
          });

          await this.sql`
            INSERT INTO project (id, name, user_id, json, height, width, created_at, updated_at)
            VALUES (
              ${projectId},
              ${`Project ${i + 1} for User ${userId.slice(-4)}`},
              ${userId},
              ${canvasJson},
              ${600},
              ${800},
              ${new Date().toISOString()},
              ${new Date().toISOString()}
            )
          `;
          projectIds.push(projectId);
        }
      }

      // Create template projects
      const templateNames = [
        'Instagram Post', 'Facebook Cover', 'Twitter Header', 
        'Business Card', 'Flyer', 'Poster', 'Logo', 'Banner',
        'YouTube Thumbnail', 'Resume', 'Brochure', 'Menu',
        'Invitation', 'Certificate', 'Newsletter', 'Infographic',
        'Book Cover', 'Album Cover', 'T-Shirt', 'Sticker'
      ];

      for (let i = 0; i < Math.min(templates, templateNames.length); i++) {
        const templateId = createId();
        const canvasJson = JSON.stringify({
          version: "5.3.0",
          objects: [],
          background: "#ffffff",
        });

        await this.sql`
          INSERT INTO project (
            id, name, user_id, json, height, width, 
            is_template, created_at, updated_at
          )
          VALUES (
            ${templateId},
            ${templateNames[i]},
            ${userIds[0]},
            ${canvasJson},
            ${800},
            ${600},
            ${true},
            ${new Date().toISOString()},
            ${new Date().toISOString()}
          )
        `;
      }

      return {
        message: `Generated ${users} users, ${users * projectsPerUser} projects, and ${templates} templates`,
        userIds,
        projectIds,
      };
    } catch (error) {
      throw new Error(`Seed data generation failed: ${error}`);
    }
  }

  /**
   * Clear all data (development only)
   */
  async clearAllData() {
    try {
      await this.sql`TRUNCATE TABLE training_data CASCADE`;
      await this.sql`TRUNCATE TABLE resize_session CASCADE`;
      await this.sql`TRUNCATE TABLE project CASCADE`;
      await this.sql`TRUNCATE TABLE authenticator CASCADE`;
      await this.sql`TRUNCATE TABLE verification_token CASCADE`;
      await this.sql`TRUNCATE TABLE session CASCADE`;
      await this.sql`TRUNCATE TABLE account CASCADE`;
      await this.sql`TRUNCATE TABLE "user" CASCADE`;
      
      return { message: 'All data cleared successfully' };
    } catch (error) {
      throw new Error(`Failed to clear data: ${error}`);
    }
  }

  /**
   * Create database backup
   */
  async createBackup(filename?: string) {
    try {
      const backupDir = join(process.cwd(), 'backups');
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = filename || `backup-${timestamp}.sql`;
      const backupPath = join(backupDir, backupFile);

      // Use pg_dump to create backup
      const cmd = `pg_dump ${process.env.DATABASE_URL} > ${backupPath}`;
      execSync(cmd);

      return {
        message: 'Backup created successfully',
        file: backupPath,
        size: this.formatBytes(Buffer.byteLength(readFileSync(backupPath))),
      };
    } catch (error) {
      throw new Error(`Backup failed: ${error}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFile: string) {
    try {
      const backupPath = join(process.cwd(), 'backups', backupFile);
      
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      // Use psql to restore backup
      const cmd = `psql ${process.env.DATABASE_URL} < ${backupPath}`;
      execSync(cmd);

      return {
        message: 'Database restored successfully',
        file: backupPath,
      };
    } catch (error) {
      throw new Error(`Restore failed: ${error}`);
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const health = await this.checkHealth();

    // Performance recommendations
    if (health.performance.cacheHitRatio < 80) {
      recommendations.push(
        `Increase shared_buffers to improve cache hit ratio (currently ${health.performance.cacheHitRatio.toFixed(1)}%)`
      );
    }

    if (health.performance.indexUsage < 70) {
      recommendations.push(
        `Consider adding indexes for frequently queried columns (index usage: ${health.performance.indexUsage.toFixed(1)}%)`
      );
    }

    // Table-specific recommendations
    for (const table of health.tableStats) {
      if (table.rows > 100000) {
        recommendations.push(
          `Consider partitioning table ${table.name} (${table.rows} rows)`
        );
      }
    }

    // Bloat recommendations
    for (const bloat of health.performance.bloat) {
      recommendations.push(
        `Run VACUUM ANALYZE on ${bloat.table} (${bloat.bloatPercentage}% bloat)`
      );
    }

    // Size recommendations
    const largeTables = health.tableStats.filter(t => t.size.includes('GB'));
    if (largeTables.length > 0) {
      recommendations.push(
        `Consider archiving old data from large tables: ${largeTables.map(t => t.name).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Close database connection
   */
  async close() {
    // Neon doesn't require explicit connection closing
  }
}
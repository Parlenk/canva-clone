# Quick Database Setup Guide

## Step 1: Environment Setup

```bash
# Copy environment variables
cp .env.example .env.local

# Edit DATABASE_URL in .env.local
nano .env.local
```

## Step 2: Install Dependencies

```bash
npm install --legacy-peer-deps
```

## Step 3: Database Setup

```bash
# Run all database setup steps at once
npm run db:setup

# Or run individually:
npm run db:migrate    # Apply migrations
npm run db:seed       # Generate test data
```

## Step 4: Verify Setup

```bash
# Check database health
npm run db:health

# Validate schema
npm run db:validate

# Interactive management
npm run db:cli
```

## Common Commands

### Development
```bash
npm run dev                    # Start development server
npm run db:cli                 # Interactive database management
npm run db:health              # Quick health check
npm run db:seed                # Generate test data
```

### Production
```bash
npm run db:migrate             # Apply pending migrations
npm run db:backup              # Create backup
npm run db:health              # Verify health
```

### Troubleshooting
```bash
npm run db:reset               # Clear all data (dev only)
npm run db:validate            # Check schema integrity
npm run db:cli                 # Interactive troubleshooting
```

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run db:cli` | Interactive database management |
| `npm run db:health` | Quick health check |
| `npm run db:seed` | Generate test data |
| `npm run db:validate` | Schema validation |
| `npm run db:backup` | Create backup |
| `npm run db:reset` | Clear all data (dev) |
| `npm run db:setup` | Complete setup (migrate + seed) |

## First Time Setup Complete! 🎉

Your database management agent is ready to use. Run `npm run db:cli` for interactive management.
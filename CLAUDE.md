# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Main Commands:**
- `npm run dev` - Start development server 
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Lint and auto-fix issues
- `npm run format` - Check formatting with Prettier
- `npm run format:fix` - Format code with Prettier

**Database Commands:**
- `npm run db:generate` - Generate Drizzle schema migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

**Installation:**
Use `npm install --legacy-peer-deps` due to fabric.js dependency constraints.

## Architecture Overview

This is a Canva clone built with Next.js 14, featuring a canvas-based design editor with AI-powered capabilities.

### Core Technologies
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Canvas Engine**: Fabric.js 5.3.0-browser for the design editor
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth.js v5 with GitHub/Google OAuth
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack Query (React Query)
- **File Uploads**: UploadThing
- **Payments**: Stripe integration
- **AI Features**: Replicate API for image generation and background removal

### Project Structure

**Key Directories:**
- `src/app/` - Next.js App Router pages and API routes
- `src/features/` - Feature-based modules (editor, auth, projects, etc.)
- `src/components/` - Shared UI components
- `src/db/` - Database schema and configuration
- `src/lib/` - Utility libraries and external service configs

**Feature Modules:**
- `features/editor/` - Canvas editor with Fabric.js integration
- `features/auth/` - Authentication components and utilities  
- `features/projects/` - Project CRUD operations
- `features/ai/` - AI image generation and background removal
- `features/subscriptions/` - Stripe billing and subscription management
- `features/images/` - Unsplash integration

### Editor Architecture

The editor is built around Fabric.js with a custom hook-based architecture:

**Core Editor Hook**: `features/editor/hooks/use-editor.ts`
- Manages canvas state, tools, and operations
- Returns `Editor` interface with all canvas methods

**Key Editor Types**: `features/editor/types.ts`
- `ActiveTool` - Available editor tools (select, shapes, text, images, etc.)
- `Editor` interface - Complete editor API
- Canvas configuration constants

**Editor Components**: `features/editor/components/`
- `editor.tsx` - Main editor component
- Tool-specific sidebars (shape-sidebar, text-sidebar, etc.)
- Canvas toolbar and navigation

### Database Schema

**Main Tables** (see `src/db/schema.ts`):
- `users` - User accounts
- `projects` - Design projects with canvas JSON data
- `subscriptions` - Stripe subscription management
- NextAuth.js tables (accounts, sessions, etc.)

**Key Fields:**
- `projects.json` - Serialized Fabric.js canvas state
- `projects.isTemplate` - Template vs user project flag
- `projects.isPro` - Pro feature requirement flag

### API Architecture

**API Routes** (`src/app/api/[[...route]]/`):
- Uses Hono.js for API routing
- Modular route files: `projects.ts`, `ai.ts`, `images.ts`, etc.
- NextAuth.js integration for authentication

### Environment Setup

Required environment variables (see README.md for details):
- Database: `DATABASE_URL` (PostgreSQL)
- Auth: `AUTH_SECRET`, `AUTH_GITHUB_ID/SECRET`, `AUTH_GOOGLE_ID/SECRET`
- External APIs: `REPLICATE_API_TOKEN`, `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`
- File uploads: `UPLOADTHING_TOKEN`
- Payments: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

## Development Notes

**Key Fabric.js Integration Points:**
- Canvas initialization in `use-editor.ts`
- Custom object properties via `JSON_KEYS` constant
- Editor tools map to specific Fabric.js operations
- Canvas state serialization for project persistence

**State Management Patterns:**
- Zustand stores for modals and UI state
- TanStack Query for server state
- Editor state managed in custom hooks

**File Organization:**
- Feature-based structure with co-located API hooks, components, and utilities
- Shared components in `components/ui/` use Radix + Tailwind
- External service integrations in `lib/` directory

## New Features (August 2024)

### Adobe AI Import Integration
**Files Added/Modified:**
- `src/features/editor/services/adobe-ai-parser.ts` - Adobe AI file parsing service
- `src/features/editor/components/sidebar.tsx` - Added Adobe AI import button
- `src/features/editor/components/template-sidebar.tsx` - Fixed template loading issues
- `src/app/api/[[...route]]/projects.ts` - Made templates endpoint public

**Capabilities:**
- ✅ Import Adobe Illustrator (.ai) files directly
- ✅ Support for both PostScript and PDF-based AI formats
- ✅ Graceful fallback for complex AI features
- ✅ Drag-and-drop file import
- ✅ Direct file upload via sidebar button
- ✅ Error handling with helpful messages

**Usage:**
1. Click the "Adobe AI" button in the sidebar
2. Select .ai file from your computer
3. File is parsed and imported as canvas objects
4. Use the Resize tool to adjust dimensions

### Template System Fixes
- ✅ Fixed 401 unauthorized errors on templates endpoint
- ✅ Templates now load without authentication
- ✅ Proper error handling for empty template states
- ✅ Updated response format to match frontend expectations

### Production Deployment
- ✅ Successfully deployed to Vercel: https://kredimage-kmxwz8dl5-enson-arantes-projects.vercel.app
- ✅ All TypeScript build issues resolved
- ✅ Testing files excluded from production build
- ✅ Database management utilities updated for production
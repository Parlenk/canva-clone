# Code Quality Development Agent

A comprehensive code quality checking system for the Next.js Canva clone project.

## Overview

The Quality Agent is a custom-built development tool that performs automated code quality checks on this Next.js 14 TypeScript project. It integrates with existing tools (ESLint, Prettier, TypeScript) and adds additional security and import analysis capabilities.

## Features

### 1. **ESLint Analysis**
- **Purpose**: Code quality and style checking
- **Configuration**: `eslint.config.mjs` with Next.js and Prettier integration
- **Rules**: Custom rules for React, Next.js, and Fabric.js
- **Auto-fix**: Available via `npm run lint:fix`

### 2. **Prettier Formatting**
- **Purpose**: Code formatting and consistency
- **Configuration**: `.prettierrc.mjs` with Tailwind CSS plugin
- **Features**: Import sorting, className sorting, consistent formatting
- **Auto-fix**: Available via `npm run format:fix`

### 3. **TypeScript Type Checking**
- **Purpose**: Static type analysis
- **Configuration**: `tsconfig.json` with strict mode enabled
- **Features**: Full type checking, noEmit mode for CI/CD
- **Command**: `npm run type-check`

### 4. **Security Audit**
- **Purpose**: Dependency vulnerability scanning
- **Tool**: npm audit
- **Features**: Identifies security vulnerabilities in dependencies
- **Auto-fix**: Available via `npm run audit:fix`

### 5. **Import Analysis**
- **Purpose**: Check for unused dependencies and circular imports
- **Features**: Identifies unused packages, suggests cleanup
- **Custom**: Built specifically for this project structure

## Installation

No additional installation required - the agent uses existing dependencies:

```bash
# Ensure all dependencies are installed
npm install --legacy-peer-deps
```

## Usage

### Quick Start
```bash
# Run all quality checks
npm run quality:check

# Run specific checks
npm run quality:lint        # ESLint only
npm run quality:format      # Prettier only
npm run quality:types       # TypeScript only
npm run quality:security    # Security audit only
npm run quality:imports     # Import analysis only
```

### Advanced Usage

#### Direct Script Usage
```bash
# Run the agent directly
node scripts/quality-agent.js --all --report

# Run with auto-fix
node scripts/quality-agent.js --all --fix

# Run specific checks
node scripts/quality-agent.js --lint --fix
node scripts/quality-agent.js --format --fix
node scripts/quality-agent.js --types
node scripts/quality-agent.js --security
```

#### CLI Options
- `--all`: Run all quality checks (default)
- `--lint`: Run only ESLint
- `--format`: Run only Prettier
- `--types`: Run only TypeScript checks
- `--security`: Run only security audit
- `--imports`: Run only import analysis
- `--fix`: Auto-fix issues where possible
- `--report`: Generate detailed report
- `--help`: Show help

### Pre-commit Hook
The agent can be integrated with Git hooks for automatic quality checks:

```bash
# Install husky (if not already installed)
npm install --save-dev husky

# Enable Git hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

## Configuration

### Quality Agent Configuration
File: `quality-agent.config.js`

```javascript
const qualityAgent = {
  project: {
    framework: "Next.js 14",
    language: "TypeScript",
    styling: "Tailwind CSS",
    canvasEngine: "Fabric.js 5.3.0-browser"
  },
  thresholds: {
    maxWarnings: 10,
    maxErrors: 0,
    maxBundleSize: "2MB"
  }
};
```

### ESLint Configuration
File: `eslint.config.mjs`

```javascript
export default [
  ...compat.extends('next/core-web-vitals', 'plugin:prettier/recommended'),
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'react/react-in-jsx-scope': 'off'
    }
  }
];
```

### Prettier Configuration
File: `.prettierrc.mjs`

```javascript
export default {
  plugins: [mixedPlugin],
  semi: true,
  singleQuote: true,
  printWidth: 140,
  importOrder: ['<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
};
```

## Quality Checks Details

### 1. ESLint Analysis
**Checks:**
- Code style consistency
- Potential bugs and anti-patterns
- React best practices
- Next.js specific rules
- Fabric.js integration patterns

**Output:**
- Error and warning counts
- Specific file locations
- Suggested fixes

### 2. Prettier Formatting
**Checks:**
- Code formatting consistency
- Import order and organization
- Tailwind CSS class sorting
- Quotation mark consistency
- Line length compliance

**Output:**
- Files needing formatting
- Specific formatting issues
- Auto-fix suggestions

### 3. TypeScript Type Checking
**Checks:**
- Type safety across the codebase
- Interface definitions
- Generic type usage
- Async/await patterns
- Fabric.js type compatibility

**Output:**
- Type errors and warnings
- Specific type issues
- Suggested type fixes

### 4. Security Audit
**Checks:**
- Known vulnerabilities in dependencies
- Outdated packages
- Security advisories
- Critical and moderate severity issues

**Current Issues:**
- Next.js authorization bypass (critical)
- esbuild development server vulnerability (moderate)

### 5. Import Analysis
**Checks:**
- Unused dependencies
- Circular dependencies
- Relative vs absolute imports
- Third-party package usage

**Output:**
- Unused dependency list
- Import optimization suggestions
- Bundle size impact analysis

## Reports

### Quality Report
Generated after each run: `quality-report.json`

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "linting": { "passed": true, "issues": [] },
    "formatting": { "passed": true, "issues": [] },
    "typescript": { "passed": true, "issues": [] },
    "security": { "passed": false, "issues": [...] }
  },
  "summary": {
    "passed": 3,
    "failed": 1,
    "qualityScore": 75
  },
  "recommendations": [...]
}
```

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci --legacy-peer-deps
      - run: npm run quality:check
```

#### GitLab CI Example
```yaml
quality_check:
  stage: test
  script:
    - npm ci --legacy-peer-deps
    - npm run quality:check
  only:
    - merge_requests
    - main
```

## Troubleshooting

### Common Issues

#### 1. Prettier Configuration Error
```bash
# If you see "Cannot find package 'prettier'"
npm install --legacy-peer-deps
# or
npm install prettier --save-dev
```

#### 2. ESLint Timeout
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run quality:lint
```

#### 3. TypeScript Memory Issues
```bash
# Increase TypeScript memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run type-check
```

#### 4. Security Audit Failures
```bash
# Review security issues before fixing
npm audit --audit-level=moderate

# Fix with caution (may introduce breaking changes)
npm run audit:fix
```

### Performance Optimization

#### 1. Parallel Execution
```bash
# Run checks in parallel (advanced)
npm run lint & npm run type-check & wait
```

#### 2. Caching
```bash
# Use Next.js cache for faster builds
npm run build -- --no-lint
```

### Support

For issues with the Quality Agent:
1. Check the generated `quality-report.json`
2. Review individual tool configurations
3. Run commands with `--verbose` flag
4. Check project dependencies with `npm ls`

## Contributing

To improve the Quality Agent:
1. Update `quality-agent.config.js` for new rules
2. Modify `scripts/quality-agent.js` for new checks
3. Add new quality thresholds as needed
4. Test changes with existing codebase

## License

MIT - Same as the main project license.
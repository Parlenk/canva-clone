/**
 * Quality Agent Configuration for Canva Clone
 * Comprehensive code quality checking system for Next.js 14 TypeScript project
 */

const qualityAgent = {
  name: "CanvaCloneQualityAgent",
  version: "1.0.0",
  description: "Comprehensive code quality checker for Next.js Canva clone",
  
  // Core project information
  project: {
    framework: "Next.js 14",
    language: "TypeScript",
    styling: "Tailwind CSS",
    canvasEngine: "Fabric.js 5.3.0-browser",
    database: "PostgreSQL with Drizzle ORM",
    authentication: "NextAuth.js v5"
  },

  // Quality check categories
  checks: {
    linting: {
      name: "ESLint Analysis",
      description: "Code quality and style checking",
      command: "npm run lint",
      fixCommand: "npm run lint:fix",
      configFile: "eslint.config.mjs",
      extends: ["next/core-web-vitals", "plugin:prettier/recommended"],
      rules: {
        "prettier/prettier": ["error", { endOfLine: "auto" }],
        "react/react-in-jsx-scope": "off"
      }
    },
    
    formatting: {
      name: "Prettier Formatting",
      description: "Code formatting and consistency",
      command: "npm run format",
      fixCommand: "npm run format:fix",
      configFile: ".prettierrc.mjs",
      options: {
        semi: true,
        singleQuote: true,
        printWidth: 140,
        importOrder: ["<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]"],
        importOrderSeparation: true,
        importOrderSortSpecifiers: true
      }
    },
    
    typescript: {
      name: "TypeScript Type Checking",
      description: "Static type analysis",
      command: "npx tsc --noEmit",
      configFile: "tsconfig.json",
      strictMode: true,
      target: "ESNext",
      moduleResolution: "bundler"
    },
    
    security: {
      name: "Security Audit",
      description: "Dependency vulnerability scanning",
      command: "npm audit --audit-level=moderate",
      fixCommand: "npm audit fix",
      currentVulnerabilities: {
        critical: 1,
        moderate: 4,
        issues: [
          "Next.js authorization bypass vulnerability",
          "esbuild development server security issue"
        ]
      }
    },
    
    imports: {
      name: "Import Analysis",
      description: "Check for unused dependencies and circular imports",
      patterns: [
        "**/*.ts",
        "**/*.tsx",
        "!node_modules/**",
        "!.next/**"
      ],
      checks: [
        "unused-imports",
        "circular-dependencies",
        "relative-vs-absolute-imports"
      ]
    },
    
    bundle: {
      name: "Bundle Analysis",
      description: "Check bundle size and dependencies",
      maxBundleSize: "2MB",
      checkDuplicates: true,
      analyzeCommand: "npm run build && npx bundle-analyzer .next"
    }
  },

  // File patterns for different types of analysis
  filePatterns: {
    typescript: ["**/*.ts", "**/*.tsx"],
    javascript: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    styles: ["**/*.css", "**/*.scss", "**/*.module.css"],
    config: ["next.config.mjs", "tailwind.config.ts", "eslint.config.mjs", ".prettierrc.mjs"],
    ignore: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "*.min.js",
      "coverage/**"
    ]
  },

  // Quality thresholds
  thresholds: {
    maxWarnings: 10,
    maxErrors: 0,
    maxBundleSize: "2MB",
    maxDuplicatedDeps: 3,
    coverage: 80
  },

  // Custom rules for this project
  customRules: {
    fabricjs: {
      description: "Fabric.js specific rules",
      rules: [
        "Avoid direct canvas manipulation outside use-editor hook",
        "Use proper type definitions for Fabric objects",
        "Implement proper cleanup in useEffect hooks"
      ]
    },
    nextjs: {
      description: "Next.js 14 specific rules",
      rules: [
        "Use App Router conventions",
        "Implement proper loading and error boundaries",
        "Use server components where appropriate",
        "Follow data fetching patterns with TanStack Query"
      ]
    },
    react: {
      description: "React 18 specific rules",
      rules: [
        "Use proper hooks dependencies",
        "Implement concurrent features safely",
        "Avoid memory leaks in canvas operations"
      ]
    }
  }
};

module.exports = qualityAgent;
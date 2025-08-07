#!/usr/bin/env node

/**
 * Quality Agent - Comprehensive Code Quality Checker
 * Usage: node scripts/quality-agent.js [options]
 * 
 * Options:
 *   --all          Run all quality checks
 *   --lint         Run only ESLint
 *   --format       Run only Prettier
 *   --types        Run only TypeScript checks
 *   --security     Run only security audit
 *   --imports      Run only import analysis
 *   --fix          Auto-fix issues where possible
 *   --report       Generate detailed report
 *   --help         Show help
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QualityAgent {
  constructor() {
    this.config = require('../quality-agent.config.js');
    this.results = {
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: 0
      }
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
  }

  async runCommand(command, description) {
    this.log(`Running: ${description}`, 'info');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      return {
        success: true,
        output: output.trim(),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        output: error.stdout?.trim() || '',
        error: error.stderr?.trim() || error.message
      };
    }
  }

  async runLintCheck(fix = false) {
    const command = fix ? this.config.checks.linting.fixCommand : this.config.checks.linting.command;
    const result = await this.runCommand(command, 'ESLint Analysis');
    
    this.results.checks.linting = {
      name: 'ESLint',
      passed: result.success,
      output: result.output,
      error: result.error,
      issues: this.parseLintOutput(result.output, result.error)
    };

    if (!result.success) {
      this.results.summary.errors += 1;
    } else {
      this.results.summary.passed += 1;
    }

    return result.success;
  }

  async runFormatCheck(fix = false) {
    const command = fix ? this.config.checks.formatting.fixCommand : this.config.checks.formatting.command;
    const result = await this.runCommand(command, 'Prettier Formatting');
    
    this.results.checks.formatting = {
      name: 'Prettier',
      passed: result.success,
      output: result.output,
      error: result.error,
      issues: this.parseFormatOutput(result.output, result.error)
    };

    if (!result.success) {
      this.results.summary.warnings += 1;
    } else {
      this.results.summary.passed += 1;
    }

    return result.success;
  }

  async runTypeScriptCheck() {
    const result = await this.runCommand(this.config.checks.typescript.command, 'TypeScript Type Checking');
    
    this.results.checks.typescript = {
      name: 'TypeScript',
      passed: result.success,
      output: result.output,
      error: result.error,
      issues: this.parseTypeScriptOutput(result.output, result.error)
    };

    if (!result.success) {
      this.results.summary.errors += 1;
    } else {
      this.results.summary.passed += 1;
    }

    return result.success;
  }

  async runSecurityAudit() {
    const result = await this.runCommand(this.config.checks.security.command, 'Security Audit');
    
    this.results.checks.security = {
      name: 'Security Audit',
      passed: result.success,
      output: result.output,
      error: result.error,
      issues: this.parseSecurityOutput(result.output, result.error)
    };

    if (!result.success) {
      this.results.summary.warnings += 1;
    } else {
      this.results.summary.passed += 1;
    }

    return result.success;
  }

  async runImportAnalysis() {
    this.log('Running Import Analysis', 'info');
    
    const issues = await this.analyzeImports();
    
    this.results.checks.imports = {
      name: 'Import Analysis',
      passed: issues.length === 0,
      output: issues.length > 0 ? issues.join('\n') : 'No import issues found',
      error: null,
      issues: issues
    };

    if (issues.length > 0) {
      this.results.summary.warnings += 1;
    } else {
      this.results.summary.passed += 1;
    }

    return issues.length === 0;
  }

  parseLintOutput(output, error) {
    if (!error && !output) return [];
    
    const lines = (error || output).split('\n');
    return lines
      .filter(line => line.includes('error') || line.includes('warning'))
      .map(line => ({
        type: line.includes('error') ? 'error' : 'warning',
        message: line.trim(),
        file: line.split(':')[0] || 'unknown'
      }));
  }

  parseFormatOutput(output, error) {
    if (!error && !output) return [];
    
    const lines = (error || output).split('\n');
    return lines
      .filter(line => line.includes('.ts') || line.includes('.tsx'))
      .map(line => ({
        type: 'formatting',
        message: line.trim(),
        file: line.trim()
      }));
  }

  parseTypeScriptOutput(output, error) {
    if (!error && !output) return [];
    
    const lines = (error || output).split('\n');
    return lines
      .filter(line => line.includes('error'))
      .map(line => ({
        type: 'typescript',
        message: line.trim(),
        file: line.split('(')[0] || 'unknown'
      }));
  }

  parseSecurityOutput(output, error) {
    if (!output) return [];
    
    const lines = output.split('\n');
    return lines
      .filter(line => line.includes('vulnerability') || line.includes('Severity'))
      .map(line => ({
        type: 'security',
        message: line.trim(),
        severity: line.includes('critical') ? 'critical' : 
                 line.includes('high') ? 'high' : 
                 line.includes('moderate') ? 'moderate' : 'low'
      }));
  }

  async analyzeImports() {
    const issues = [];
    
    try {
      // Check for unused dependencies
      const packageJson = require('../package.json');
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const usedImports = new Set();
      
      // Scan TypeScript files for imports
      const scanImports = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        files.forEach(file => {
          const filePath = path.join(dir, file.name);
          
          if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
            scanImports(filePath);
          } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
            const content = fs.readFileSync(filePath, 'utf8');
            const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
            let match;
            
            while ((match = importRegex.exec(content)) !== null) {
              usedImports.add(match[1]);
            }
          }
        });
      };
      
      scanImports('./src');
      
      // Check for potentially unused dependencies
      Object.keys(allDeps).forEach(dep => {
        if (!usedImports.has(dep) && !dep.startsWith('@types/')) {
          issues.push({
            type: 'unused-dependency',
            message: `Potentially unused dependency: ${dep}`,
            severity: 'info'
          });
        }
      });
      
    } catch (error) {
      issues.push({
        type: 'analysis-error',
        message: `Error analyzing imports: ${error.message}`,
        severity: 'warning'
      });
    }
    
    return issues;
  }

  async generateReport() {
    const reportPath = path.join(process.cwd(), 'quality-report.json');
    
    const report = {
      ...this.results,
      summary: {
        ...this.results.summary,
        totalChecks: Object.keys(this.results.checks).length,
        qualityScore: Math.round(
          (this.results.summary.passed / Object.keys(this.results.checks).length) * 100
        )
      },
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Quality report generated: ${reportPath}`, 'success');
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Security recommendations
    if (this.results.checks.security && !this.results.checks.security.passed) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        action: 'Update Next.js and esbuild to fix critical vulnerabilities',
        command: 'npm audit fix --force'
      });
    }
    
    // TypeScript recommendations
    if (this.results.checks.typescript && !this.results.checks.typescript.passed) {
      recommendations.push({
        category: 'typescript',
        priority: 'high',
        action: 'Fix TypeScript errors before deployment',
        details: 'Check the TypeScript output for specific type errors'
      });
    }
    
    // Format recommendations
    if (this.results.checks.formatting && !this.results.checks.formatting.passed) {
      recommendations.push({
        category: 'formatting',
        priority: 'medium',
        action: 'Run prettier formatting',
        command: 'npm run format:fix'
      });
    }
    
    return recommendations;
  }

  async run(options = {}) {
    this.log('Starting Quality Agent...', 'info');
    this.log(`Project: ${this.config.project.framework} ${this.config.project.language}`, 'info');
    
    const checks = [];
    
    if (options.all || options.lint) {
      checks.push(() => this.runLintCheck(options.fix));
    }
    
    if (options.all || options.format) {
      checks.push(() => this.runFormatCheck(options.fix));
    }
    
    if (options.all || options.types) {
      checks.push(() => this.runTypeScriptCheck());
    }
    
    if (options.all || options.security) {
      checks.push(() => this.runSecurityAudit());
    }
    
    if (options.all || options.imports) {
      checks.push(() => this.runImportAnalysis());
    }
    
    if (checks.length === 0) {
      checks.push(
        () => this.runLintCheck(),
        () => this.runFormatCheck(),
        () => this.runTypeScriptCheck(),
        () => this.runSecurityAudit()
      );
    }
    
    // Run all checks
    for (const check of checks) {
      await check();
    }
    
    // Generate report if requested
    if (options.report) {
      await this.generateReport();
    }
    
    this.printSummary();
    
    return this.results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('QUALITY AGENT SUMMARY');
    console.log('='.repeat(50));
    
    Object.entries(this.results.checks).forEach(([key, check]) => {
      const status = check.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check.name}`);
    });
    
    console.log('\n' + '-'.repeat(50));
    console.log(`Total Checks: ${Object.keys(this.results.checks).length}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Warnings: ${this.results.summary.warnings}`);
    console.log(`Errors: ${this.results.summary.errors}`);
    
    const score = Math.round(
      (this.results.summary.passed / Object.keys(this.results.checks).length) * 100
    );
    console.log(`Quality Score: ${score}%`);
    console.log('='.repeat(50));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Quality Agent - Code Quality Checker

Usage: node scripts/quality-agent.js [options]

Options:
  --all          Run all quality checks (default)
  --lint         Run only ESLint
  --format       Run only Prettier
  --types        Run only TypeScript checks
  --security     Run only security audit
  --imports      Run only import analysis
  --fix          Auto-fix issues where possible
  --report       Generate detailed report
  --help         Show this help

Examples:
  node scripts/quality-agent.js --all --report
  node scripts/quality-agent.js --lint --fix
  node scripts/quality-agent.js --security
    `);
    process.exit(0);
  }
  
  const options = {
    all: args.includes('--all'),
    lint: args.includes('--lint'),
    format: args.includes('--format'),
    types: args.includes('--types'),
    security: args.includes('--security'),
    imports: args.includes('--imports'),
    fix: args.includes('--fix'),
    report: args.includes('--report')
  };
  
  const agent = new QualityAgent();
  agent.run(options)
    .then(results => {
      const hasErrors = Object.values(results.checks).some(check => !check.passed);
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.error('Quality Agent failed:', error);
      process.exit(1);
    });
}

module.exports = QualityAgent;
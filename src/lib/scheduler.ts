/**
 * Automated Training Scheduler
 * 
 * This service runs background tasks for model retraining and optimization.
 * In production, this would be replaced with a proper job scheduler like Bull or Agenda.
 */

import { ABTestingService } from '@/features/editor/services/ab-testing';

interface ScheduledTask {
  id: string;
  name: string;
  interval: number; // milliseconds
  lastRun: Date | null;
  enabled: boolean;
  task: () => Promise<void>;
}

class TrainingScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Register default tasks
    this.registerTask({
      id: 'ab-optimization',
      name: 'A/B Test Weight Optimization',
      interval: 24 * 60 * 60 * 1000, // Daily
      lastRun: null,
      enabled: true,
      task: this.optimizeABTestWeights.bind(this),
    });

    this.registerTask({
      id: 'performance-analysis',
      name: 'Performance Analysis',
      interval: 7 * 24 * 60 * 60 * 1000, // Weekly
      lastRun: null,
      enabled: true,
      task: this.analyzePerformance.bind(this),
    });

    this.registerTask({
      id: 'model-retraining',
      name: 'Automated Model Retraining',
      interval: 30 * 24 * 60 * 60 * 1000, // Monthly
      lastRun: null,
      enabled: false, // Disabled by default, requires admin intervention
      task: this.performModelRetraining.bind(this),
    });
  }

  registerTask(task: ScheduledTask) {
    this.tasks.set(task.id, task);
  }

  startScheduler() {
    console.log('🕒 Starting AI Training Scheduler...');
    
    this.tasks.forEach((task, taskId) => {
      if (task.enabled) {
        this.scheduleTask(taskId);
      }
    });

    console.log(`✅ Scheduler started with ${Array.from(this.tasks.values()).filter(t => t.enabled).length} active tasks`);
  }

  stopScheduler() {
    console.log('⏹️ Stopping AI Training Scheduler...');
    
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    
    this.intervals.clear();
    console.log('✅ Scheduler stopped');
  }

  private scheduleTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const interval = setInterval(async () => {
      try {
        console.log(`🔄 Running scheduled task: ${task.name}`);
        await task.task();
        task.lastRun = new Date();
        console.log(`✅ Completed task: ${task.name}`);
      } catch (error) {
        console.error(`❌ Task failed: ${task.name}`, error);
      }
    }, task.interval);

    this.intervals.set(taskId, interval);
  }

  // Task implementations
  private async optimizeABTestWeights() {
    console.log('🧪 Optimizing A/B test weights...');
    
    const comparison = ABTestingService.getPerformanceComparison();
    const hasEnoughData = comparison.some(variant => variant.metrics.totalUses >= 100);

    if (hasEnoughData) {
      ABTestingService.autoOptimizeWeights();
      console.log('📊 A/B test weights optimized based on performance data');
    } else {
      console.log('⏳ Not enough data for A/B optimization (need 100+ uses per variant)');
    }
  }

  private async analyzePerformance() {
    console.log('📈 Analyzing performance trends...');
    
    const comparison = ABTestingService.getPerformanceComparison();
    
    // Generate performance report
    const report = {
      timestamp: new Date().toISOString(),
      variants: comparison,
      insights: this.generateInsights(comparison),
      recommendations: this.generateRecommendations(comparison),
    };

    console.log('📋 Performance Analysis Report:', report);

    // In production, you might save this to database or send alerts
    if (report.insights.needsAttention) {
      console.warn('⚠️ Performance issues detected - manual review recommended');
    }
  }

  private async performModelRetraining() {
    console.log('🤖 Performing automated model retraining...');
    
    // This would call the retraining API endpoint
    // For now, just log that it would happen
    console.log('📚 Would trigger model retraining with recent data...');
    console.log('💡 In production: Call /api/ai/retrain-model endpoint');
  }

  private generateInsights(comparison: ReturnType<typeof ABTestingService.getPerformanceComparison>) {
    const activeVariants = comparison.filter(v => v.active);
    
    if (activeVariants.length === 0) {
      return { needsAttention: true, message: 'No active variants' };
    }

    const avgRating = activeVariants.reduce((sum, v) => sum + v.metrics.avgRating, 0) / activeVariants.length;
    const avgSuccessRate = activeVariants.reduce((sum, v) => sum + v.metrics.successRate, 0) / activeVariants.length;

    const bestVariant = activeVariants[0];
    const worstVariant = activeVariants[activeVariants.length - 1];

    return {
      needsAttention: avgRating < 3.5 || avgSuccessRate < 60,
      avgRating: Math.round(avgRating * 100) / 100,
      avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      performanceGap: bestVariant.metrics.avgRating - worstVariant.metrics.avgRating,
      bestVariant: bestVariant.name,
      worstVariant: worstVariant.name,
    };
  }

  private generateRecommendations(comparison: ReturnType<typeof ABTestingService.getPerformanceComparison>) {
    const recommendations: string[] = [];
    const activeVariants = comparison.filter(v => v.active);

    if (activeVariants.length < 2) {
      recommendations.push('Consider adding more prompt variants for better A/B testing');
    }

    const lowPerformanceVariants = activeVariants.filter(v => v.metrics.avgRating < 3.0);
    if (lowPerformanceVariants.length > 0) {
      recommendations.push(`Disable or improve low-performing variants: ${lowPerformanceVariants.map(v => v.name).join(', ')}`);
    }

    const dataImbalance = activeVariants.some(v => v.metrics.totalUses < 50) && 
                         activeVariants.some(v => v.metrics.totalUses > 500);
    if (dataImbalance) {
      recommendations.push('Rebalance traffic distribution - some variants have insufficient data');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good - continue monitoring');
    }

    return recommendations;
  }

  // Management methods
  enableTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      this.scheduleTask(taskId);
      console.log(`✅ Enabled task: ${task.name}`);
    }
  }

  disableTask(taskId: string) {
    const task = this.tasks.get(taskId);
    const interval = this.intervals.get(taskId);
    
    if (task) {
      task.enabled = false;
    }
    
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
    }
    
    console.log(`⏹️ Disabled task: ${task?.name}`);
  }

  getTaskStatus() {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.lastRun ? new Date(task.lastRun.getTime() + task.interval) : null,
      interval: task.interval,
    }));
  }

  runTaskNow(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      console.log(`🚀 Manually triggering task: ${task.name}`);
      task.task().catch(error => {
        console.error(`❌ Manual task execution failed: ${task.name}`, error);
      });
    }
  }
}

// Export singleton instance
export const trainingScheduler = new TrainingScheduler();

// Auto-start in production (you might want to control this differently)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Only run in production server environment
  trainingScheduler.startScheduler();
}

// Development helper - start scheduler manually
export const startScheduler = () => trainingScheduler.startScheduler();
export const stopScheduler = () => trainingScheduler.stopScheduler();
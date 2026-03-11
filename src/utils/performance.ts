/**
 * Performance Monitoring System
 * Comprehensive performance tracking and optimization utilities
 */

import logger from "./logger";

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  metadata?: Record<string, unknown>;
}

export interface PerformanceConfig {
  enableTracking: boolean;
  enableMemoryTracking: boolean;
  enableDatabaseTracking: boolean;
  enableAPITracking: boolean;
  enableRenderTracking: boolean;
  slowThreshold: number; // milliseconds
  memoryThreshold: number; // bytes
  maxMetrics: number;
  enableLogging: boolean;
  enableReporting: boolean;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private isTracking = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableTracking: true,
      enableMemoryTracking: true,
      enableDatabaseTracking: true,
      enableAPITracking: true,
      enableRenderTracking: true,
      slowThreshold: 1000, // 1 second
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      maxMetrics: 1000,
      enableLogging: true,
      enableReporting: true,
      ...config,
    };

    if (this.config.enableTracking) {
      this.startTracking();
    }
  }

  private startTracking(): void {
    this.isTracking = true;

    // Track memory usage periodically
    if (this.config.enableMemoryTracking) {
      setInterval(() => {
        this.trackMemoryUsage();
      }, 30000); // Every 30 seconds
    }

    // Clean up old metrics periodically
    setInterval(() => {
      this.cleanupMetrics();
    }, 60000); // Every minute
  }

  private trackMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();

    if (memoryUsage.heapUsed > this.config.memoryThreshold) {
      logger.warn("High memory usage detected", {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        threshold: this.config.memoryThreshold,
      });
    }
  }

  private cleanupMetrics(): void {
    if (this.completedMetrics.length > this.config.maxMetrics) {
      this.completedMetrics = this.completedMetrics.slice(
        -this.config.maxMetrics,
      );
    }
  }

  // Start tracking a performance metric
  public start(name: string, metadata?: Record<string, unknown>): string {
    if (!this.isTracking) return "";

    const metricId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      memoryUsage: this.config.enableMemoryTracking
        ? process.memoryUsage()
        : undefined,
      metadata,
    };

    this.metrics.set(metricId, metric);
    return metricId;
  }

  // End tracking a performance metric
  public end(metricId: string): PerformanceMetric | null {
    if (!this.isTracking || !metricId) return null;

    const metric = this.metrics.get(metricId);
    if (!metric) return null;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Check if it's a slow operation
    if (metric.duration > this.config.slowThreshold) {
      if (this.config.enableLogging) {
        logger.warn(`Slow operation detected: ${metric.name}`, {
          duration: metric.duration,
          threshold: this.config.slowThreshold,
          metadata: metric.metadata,
        });
      }
    }

    // Move to completed metrics
    this.completedMetrics.push(metric);
    this.metrics.delete(metricId);

    return metric;
  }

  // Track a function execution
  public async trackFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    const metricId = this.start(name, metadata);

    try {
      const result = await fn();
      this.end(metricId);
      return result;
    } catch (error) {
      this.end(metricId);
      throw error;
    }
  }

  // Track a synchronous function execution
  public trackSyncFunction<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): T {
    const metricId = this.start(name, metadata);

    try {
      const result = fn();
      this.end(metricId);
      return result;
    } catch (error) {
      this.end(metricId);
      throw error;
    }
  }

  // Track database operations
  public async trackDatabase<T>(
    operation: string,
    query: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (!this.config.enableDatabaseTracking) {
      return fn();
    }

    return this.trackFunction(`DB_${operation}`, fn, {
      query: query.substring(0, 100), // Truncate long queries
      operation,
    });
  }

  // Track API calls
  public async trackAPI<T>(
    method: string,
    url: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (!this.config.enableAPITracking) {
      return fn();
    }

    return this.trackFunction(`API_${method}`, fn, {
      url,
      method,
    });
  }

  // Track React component renders
  public trackRender(
    componentName: string,
    props?: Record<string, unknown>,
  ): string {
    if (!this.config.enableRenderTracking) {
      return "";
    }

    return this.start(`RENDER_${componentName}`, {
      componentName,
      propsCount: props ? Object.keys(props).length : 0,
    });
  }

  // Get performance statistics
  public getStats(): {
    totalMetrics: number;
    averageDuration: number;
    slowOperations: PerformanceMetric[];
    memoryUsage: NodeJS.MemoryUsage;
    topSlowOperations: Array<{
      name: string;
      averageDuration: number;
      count: number;
    }>;
  } {
    const totalMetrics = this.completedMetrics.length;
    const averageDuration =
      totalMetrics > 0
        ? this.completedMetrics.reduce(
            (sum, metric) => sum + (metric.duration || 0),
            0,
          ) / totalMetrics
        : 0;

    const slowOperations = this.completedMetrics.filter(
      (metric) => (metric.duration || 0) > this.config.slowThreshold,
    );

    // Group by name and calculate averages
    const operationGroups = new Map<
      string,
      { totalDuration: number; count: number }
    >();

    this.completedMetrics.forEach((metric) => {
      const existing = operationGroups.get(metric.name) || {
        totalDuration: 0,
        count: 0,
      };
      operationGroups.set(metric.name, {
        totalDuration: existing.totalDuration + (metric.duration || 0),
        count: existing.count + 1,
      });
    });

    const topSlowOperations = Array.from(operationGroups.entries())
      .map(([name, data]) => ({
        name,
        averageDuration: data.totalDuration / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10);

    return {
      totalMetrics,
      averageDuration,
      slowOperations,
      memoryUsage: process.memoryUsage(),
      topSlowOperations,
    };
  }

  // Get metrics by name
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.completedMetrics.filter((metric) => metric.name === name);
  }

  // Clear all metrics
  public clearMetrics(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }

  // Update configuration
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enableTracking && !this.isTracking) {
      this.startTracking();
    } else if (!this.config.enableTracking && this.isTracking) {
      this.isTracking = false;
    }
  }

  // Generate performance report
  public generateReport(): string {
    const stats = this.getStats();

    return `
Performance Report
==================
Total Metrics: ${stats.totalMetrics}
Average Duration: ${stats.averageDuration.toFixed(2)}ms
Slow Operations: ${stats.slowOperations.length}
Memory Usage: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB

Top Slow Operations:
${stats.topSlowOperations
  .map(
    (op) =>
      `  ${op.name}: ${op.averageDuration.toFixed(2)}ms (${op.count} calls)`,
  )
  .join("\n")}
    `.trim();
  }
}

// Create default performance monitor instance
export const performanceMonitor = new PerformanceMonitor({
  enableTracking: process.env.NODE_ENV === "production",
  enableLogging: true,
  slowThreshold: 1000,
});

// Performance decorators for methods
export function trackPerformance(
  name?: string,
  metadata?: Record<string, unknown>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;
    const trackName = name || `${target.constructor.name}.${propertyName}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.trackFunction(
        trackName,
        () => method.apply(this, args),
        metadata,
      );
    };
  };
}

export function trackSyncPerformance(
  name?: string,
  metadata?: Record<string, unknown>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;
    const trackName = name || `${target.constructor.name}.${propertyName}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = function (...args: any[]) {
      return performanceMonitor.trackSyncFunction(
        trackName,
        () => method.apply(this, args),
        metadata,
      );
    };
  };
}

// React performance hooks
export const usePerformanceTracking = (componentName: string) => {
  const startRender = () => {
    return performanceMonitor.trackRender(componentName);
  };

  const endRender = (metricId: string) => {
    performanceMonitor.end(metricId);
  };

  return { startRender, endRender };
};

// Express middleware for request performance tracking
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const startTime = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - startTime;

    performanceMonitor.trackSyncFunction(
      "HTTP_REQUEST",
      () => {
        // Request completed
      },
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      },
    );
  });

  next();
};

export default performanceMonitor;

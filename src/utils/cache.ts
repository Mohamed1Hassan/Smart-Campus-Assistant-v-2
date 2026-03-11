/**
 * Comprehensive Caching System
 * Multi-level caching with Redis, memory, and file-based storage
 */

import logger from "./logger";

export interface CacheConfig {
  defaultTTL: number; // Time to live in seconds
  maxSize: number; // Maximum number of items in memory cache
  enableMemoryCache: boolean;
  enableRedisCache: boolean;
  enableFileCache: boolean;
  redisUrl?: string;
  fileCachePath: string;
  enableCompression: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
}

export interface CacheItem<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
  encrypted?: boolean;
}

class CacheManager {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheItem> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redisClient: any = null;
  private isInitialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 3600, // 1 hour
      maxSize: 1000,
      enableMemoryCache: true,
      enableRedisCache: false,
      enableFileCache: false,
      fileCachePath: "./cache",
      enableCompression: false,
      enableEncryption: false,
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize Redis if enabled
      if (this.config.enableRedisCache && this.config.redisUrl) {
        await this.initializeRedis();
      }

      // Initialize file cache if enabled
      if (this.config.enableFileCache) {
        await this.initializeFileCache();
      }

      this.isInitialized = true;
      logger.info("Cache system initialized", {
        memoryCache: this.config.enableMemoryCache,
        redisCache: this.config.enableRedisCache,
        fileCache: this.config.enableFileCache,
      });
    } catch (error) {
      logger.error("Failed to initialize cache system", error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Dynamic import for Redis
      const { createClient } = await import("redis");
      this.redisClient = createClient({ url: this.config.redisUrl });

      this.redisClient.on("error", (err: Error) => {
        logger.error("Redis client error", err);
      });

      await this.redisClient.connect();
      logger.info("Redis cache initialized");
    } catch (error) {
      logger.error("Failed to initialize Redis cache", error);
      this.config.enableRedisCache = false;
    }
  }

  private async initializeFileCache(): Promise<void> {
    try {
      const fs = await import("fs");

      if (!fs.existsSync(this.config.fileCachePath)) {
        fs.mkdirSync(this.config.fileCachePath, { recursive: true });
      }

      logger.info("File cache initialized", {
        path: this.config.fileCachePath,
      });
    } catch (error) {
      logger.error("Failed to initialize file cache", error);
      this.config.enableFileCache = false;
    }
  }

  // Set a value in cache
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cacheTTL = ttl || this.config.defaultTTL;
    const now = Date.now();

    const cacheItem: CacheItem<T> = {
      key,
      value,
      ttl: cacheTTL,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    // Set in memory cache
    if (this.config.enableMemoryCache) {
      await this.setMemoryCache(key, cacheItem);
    }

    // Set in Redis cache
    if (this.config.enableRedisCache && this.redisClient) {
      await this.setRedisCache(key, cacheItem);
    }

    // Set in file cache
    if (this.config.enableFileCache) {
      await this.setFileCache(key, cacheItem);
    }

    logger.debug("Cache set", { key, ttl: cacheTTL });
  }

  // Get a value from cache
  public async get<T>(key: string): Promise<T | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let cacheItem: CacheItem<T> | null = null;

    // Try memory cache first
    if (this.config.enableMemoryCache) {
      cacheItem = await this.getMemoryCache<T>(key);
    }

    // Try Redis cache if not found in memory
    if (!cacheItem && this.config.enableRedisCache && this.redisClient) {
      cacheItem = await this.getRedisCache<T>(key);

      // Store in memory cache for faster access
      if (cacheItem && this.config.enableMemoryCache) {
        await this.setMemoryCache(key, cacheItem);
      }
    }

    // Try file cache if not found in memory or Redis
    if (!cacheItem && this.config.enableFileCache) {
      cacheItem = await this.getFileCache<T>(key);

      // Store in memory cache for faster access
      if (cacheItem && this.config.enableMemoryCache) {
        await this.setMemoryCache(key, cacheItem);
      }
    }

    if (cacheItem) {
      // Check if item has expired
      if (this.isExpired(cacheItem)) {
        await this.delete(key);
        return null;
      }

      // Update access statistics
      cacheItem.accessCount++;
      cacheItem.lastAccessed = Date.now();

      logger.debug("Cache hit", { key, accessCount: cacheItem.accessCount });
      return cacheItem.value;
    }

    logger.debug("Cache miss", { key });
    return null;
  }

  // Delete a value from cache
  public async delete(key: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Delete from memory cache
    if (this.config.enableMemoryCache) {
      this.memoryCache.delete(key);
    }

    // Delete from Redis cache
    if (this.config.enableRedisCache && this.redisClient) {
      await this.redisClient.del(key);
    }

    // Delete from file cache
    if (this.config.enableFileCache) {
      await this.deleteFileCache(key);
    }

    logger.debug("Cache deleted", { key });
  }

  // Clear all cache
  public async clear(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Clear memory cache
    if (this.config.enableMemoryCache) {
      this.memoryCache.clear();
    }

    // Clear Redis cache
    if (this.config.enableRedisCache && this.redisClient) {
      await this.redisClient.flushAll();
    }

    // Clear file cache
    if (this.config.enableFileCache) {
      await this.clearFileCache();
    }

    logger.info("All caches cleared");
  }

  // Get cache statistics
  public getStats(): {
    memoryCache: { size: number; maxSize: number };
    redisCache: { connected: boolean };
    fileCache: { enabled: boolean; path: string };
    totalItems: number;
    hitRate: number;
  } {
    const memorySize = this.memoryCache.size;
    const redisConnected = this.redisClient ? true : false;

    return {
      memoryCache: {
        size: memorySize,
        maxSize: this.config.maxSize,
      },
      redisCache: {
        connected: redisConnected,
      },
      fileCache: {
        enabled: this.config.enableFileCache,
        path: this.config.fileCachePath,
      },
      totalItems: memorySize,
      hitRate: 0, // Would need to track hits/misses for accurate hit rate
    };
  }

  // Memory cache methods
  private async setMemoryCache<T>(
    key: string,
    item: CacheItem<T>,
  ): Promise<void> {
    // Check if cache is full
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.memoryCache.set(key, item);
  }

  private async getMemoryCache<T>(key: string): Promise<CacheItem<T> | null> {
    const item = this.memoryCache.get(key) as CacheItem<T> | undefined;
    return item || null;
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  // Redis cache methods
  private async setRedisCache<T>(
    key: string,
    item: CacheItem<T>,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(item);
      await this.redisClient.setEx(key, item.ttl, serialized);
    } catch (error) {
      logger.error("Failed to set Redis cache", error);
    }
  }

  private async getRedisCache<T>(key: string): Promise<CacheItem<T> | null> {
    try {
      const serialized = await this.redisClient.get(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      logger.error("Failed to get Redis cache", error);
      return null;
    }
  }

  // File cache methods
  private async setFileCache<T>(
    key: string,
    item: CacheItem<T>,
  ): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const crypto = await import("crypto");

      const filename = crypto.createHash("md5").update(key).digest("hex");
      const filepath = path.join(this.config.fileCachePath, `${filename}.json`);

      await fs.promises.writeFile(filepath, JSON.stringify(item));
    } catch (error) {
      logger.error("Failed to set file cache", error);
    }
  }

  private async getFileCache<T>(key: string): Promise<CacheItem<T> | null> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const crypto = await import("crypto");

      const filename = crypto.createHash("md5").update(key).digest("hex");
      const filepath = path.join(this.config.fileCachePath, `${filename}.json`);

      const data = await fs.promises.readFile(filepath, "utf8");
      return JSON.parse(data);
    } catch {
      // File doesn't exist or other error
      return null;
    }
  }

  private async deleteFileCache(key: string): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const crypto = await import("crypto");

      const filename = crypto.createHash("md5").update(key).digest("hex");
      const filepath = path.join(this.config.fileCachePath, `${filename}.json`);

      await fs.promises.unlink(filepath);
    } catch {
      // File doesn't exist or other error
    }
  }

  private async clearFileCache(): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      const files = await fs.promises.readdir(this.config.fileCachePath);

      for (const file of files) {
        if (file.endsWith(".json")) {
          await fs.promises.unlink(path.join(this.config.fileCachePath, file));
        }
      }
    } catch (error) {
      logger.error("Failed to clear file cache", error);
    }
  }

  // Utility methods
  private isExpired(item: CacheItem): boolean {
    const now = Date.now();
    const expirationTime = item.createdAt + item.ttl * 1000;
    return now > expirationTime;
  }

  // Cache with automatic invalidation
  public async cache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  // Cache with tags for bulk invalidation
  public async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl?: number,
  ): Promise<void> {
    await this.set(key, value, ttl);

    // Store tags for this key
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const existingKeys = (await this.get<string[]>(tagKey)) || [];
      if (!existingKeys.includes(key)) {
        existingKeys.push(key);
        await this.set(tagKey, existingKeys, ttl);
      }
    }
  }

  // Invalidate cache by tags
  public async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const keys = (await this.get<string[]>(tagKey)) || [];

      for (const key of keys) {
        await this.delete(key);
      }

      await this.delete(tagKey);
    }
  }
}

// Create default cache instance
export const cache = new CacheManager({
  defaultTTL: 3600, // 1 hour
  maxSize: 1000,
  enableMemoryCache: true,
  enableRedisCache: false,
  enableFileCache: false,
});

// Cache decorator for methods
export function cached(ttl?: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyName}.${JSON.stringify(args)}`;

      return cache.cache(cacheKey, () => method.apply(this, args), ttl);
    };
  };
}

// Express middleware for caching responses
export const cacheMiddleware = (ttl: number = 300) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (
    req: { method: string; originalUrl: string },
    res: { json: (data: any) => any },
    next: () => void,
  ) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = `response:${req.originalUrl}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Store original res.json
    const originalJson = res.json;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.json = function (data: any) {
      // Cache the response
      cache.set(cacheKey, data, ttl);

      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};

export default cache;

import Redis from 'ioredis';

// Redis连接配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableOfflineQueue: true, // 允许离线队列
  lazyConnect: true, // 延迟连接
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxLoadingTimeout: 5000,
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  },
};

// 创建Redis连接实例
const redis = new Redis(redisConfig);

// Redis连接事件监听
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error.message);
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

// Redis工具类
export class RedisService {
  private static instance: RedisService;
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = redis;
  }

  private async ensureConnection() {
    try {
      if (!this.isConnected) {
        await this.client.ping();
        this.isConnected = true;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Redis not available, operating without cache:', errorMessage);
      this.isConnected = false;
    }
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  // 设置缓存 - 增加错误处理
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return; // 如果Redis不可用，直接返回

      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to set cache key ${key}:`, errorMessage);
      // 不抛出错误，让应用继续运行
    }
  }

  // 获取缓存 - 增加错误处理
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return null; // 如果Redis不可用，返回null

      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to get cache key ${key}:`, errorMessage);
      return null;
    }
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return;
      await this.client.del(key);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to delete cache key ${key}:`, errorMessage);
    }
  }

  // 检查键是否存在
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to check existence of key ${key}:`, errorMessage);
      return false;
    }
  }

  // 设置过期时间
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return;
      await this.client.expire(key, ttl);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to set expiry for key ${key}:`, errorMessage);
    }
  }

  // 获取剩余过期时间
  async ttl(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return -1;
      return await this.client.ttl(key);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to get TTL for key ${key}:`, errorMessage);
      return -1;
    }
  }

  // 原子增加
  async incr(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return 0;
      return await this.client.incr(key);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to increment key ${key}:`, errorMessage);
      return 0;
    }
  }

  // 原子减少
  async decr(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return 0;
      return await this.client.decr(key);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to decrement key ${key}:`, errorMessage);
      return 0;
    }
  }

  // 删除匹配模式的键
  async delPattern(pattern: string): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.isConnected) return;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to delete pattern ${pattern}:`, errorMessage);
    }
  }

  // 获取原始Redis客户端（用于复杂操作）
  getClient(): Redis {
    return this.client;
  }

  // 检查连接状态
  isConnectionHealthy(): boolean {
    return this.isConnected;
  }

  // 关闭连接
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Error disconnecting from Redis:', errorMessage);
    }
  }
}

// 缓存键前缀常量
export const CACHE_KEYS = {
  // 验证码相关
  CAPTCHA: (key: string) => `captcha:${key}`,

  // 用户相关
  USER: (userId: string) => `user:${userId}`,
  USER_LIST: (query: string) => `user:list:${Buffer.from(query).toString('base64')}`,
  USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,
  USER_ROLES: (userId: string) => `user:roles:${userId}`,

  // 会话相关
  SESSION: (sessionId: string) => `session:${sessionId}`,
  REFRESH_TOKEN: (token: string) => `refresh_token:${token}`,

  // 限流相关
  RATE_LIMIT: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,

  // 文件上传
  UPLOAD_TEMP: (uploadId: string) => `upload:temp:${uploadId}`,

  // 导出任务
  EXPORT_TASK: (taskId: string) => `export:task:${taskId}`,
} as const;

// 缓存时间常量 (秒)
export const CACHE_TTL = {
  CAPTCHA: 300, // 5分钟
  USER_INFO: 3600, // 1小时
  USER_LIST: 300, // 5分钟
  USER_PERMISSIONS: 1800, // 30分钟
  SESSION: 86400, // 24小时
  REFRESH_TOKEN: 604800, // 7天
  RATE_LIMIT: 60, // 1分钟
  UPLOAD_TEMP: 3600, // 1小时
  EXPORT_TASK: 86400, // 24小时
} as const;

// 导出Redis服务单例
export const redisService = RedisService.getInstance();

// 导出Redis客户端（向下兼容）
export { redis };

// 优雅关闭Redis连接
process.on('beforeExit', async () => {
  await redisService.disconnect();
});

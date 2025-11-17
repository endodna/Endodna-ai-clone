import { createClient, RedisClientType } from "redis";
import { logger } from "../helpers/logger.helper";

class RedisHandler {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    // Use different Redis URLs based on environment
    const redisUrl =
      process.env.REDIS_URL ||
      (process.env.NODE_ENV === "production"
        ? "redis://redis:6379"
        : "redis://localhost:6379");

    this.client = createClient({
      url: redisUrl,
      pingInterval: 10000,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error("Redis reconnection failed after 10 attempts", {
              retries,
              method: "RedisHandler.constructor",
            });
            return new Error("Redis reconnection limit exceeded");
          }
          const delay = Math.min(retries * 100, 3000);
          logger.info("Redis reconnecting", {
            retries,
            delay,
            method: "RedisHandler.constructor",
          });
          return delay;
        },
        keepAlive: 30000,
      },
    });

    this.client.on("error", (err) => {
      logger.error("Redis Client Error", {
        error: err,
        method: "RedisHandler.constructor",
      });
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      logger.debug("Redis Client Connected");
      this.isConnected = true;
    });

    this.client.on("ready", () => {
      logger.debug("Redis Client Ready");
      this.isConnected = true;
    });

    this.client.on("disconnect", () => {
      logger.debug("Redis Client Disconnected");
      this.isConnected = false;
    });

    this.client.on("end", () => {
      logger.warn("Redis connection ended, will attempt to reconnect", {
        method: "RedisHandler.constructor",
      });
      this.isConnected = false;
    });

    this.client.on("reconnecting", () => {
      logger.info("Redis reconnecting...", {
        method: "RedisHandler.constructor",
      });
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
    } catch (error: any) {
      if (error?.message?.includes("Socket already opened") || error?.message?.includes("already connected")) {
        this.isConnected = true;
        return;
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async set(
    key: string,
    value: string,
    expireInSeconds?: number,
  ): Promise<void> {
    await this.connect();
    if (expireInSeconds) {
      await this.client.setEx(key, expireInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    await this.connect();
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    await this.connect();
    return await this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    await this.connect();
    return await this.client.expire(key, seconds);
  }

  async incr(key: string): Promise<number> {
    await this.connect();
    return await this.client.incr(key);
  }

  async ttl(key: string): Promise<number> {
    await this.connect();
    return await this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    await this.connect();
    return await this.client.keys(pattern);
  }

  async flushAll(): Promise<void> {
    await this.connect();
    await this.client.flushAll();
  }

  async ping(): Promise<string> {
    await this.connect();
    return await this.client.ping();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

export const redis = new RedisHandler();
export default redis;

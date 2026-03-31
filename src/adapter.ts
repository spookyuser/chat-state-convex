/**
 * ConvexStateAdapter — implements the chat SDK's StateAdapter interface
 * using Convex as the storage backend.
 *
 * Runs on a Node.js server (not inside Convex). Uses ConvexHttpClient
 * to call app-side wrapper functions that delegate to the component.
 *
 * @example
 * ```ts
 * import { createConvexState } from "chat-state-convex";
 *
 * const state = createConvexState({
 *   url: process.env.CONVEX_URL!,
 *   logger: console,
 * });
 * ```
 */

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference, type FunctionReference } from "convex/server";
import type { Lock, Logger, QueueEntry, StateAdapter } from "chat";

export interface ConvexStateAdapterOptions {
  /** Logger instance for error reporting */
  logger: Logger;
  /**
   * The module path in the app where chatState wrapper functions are exported.
   * Defaults to "chatState" (i.e., convex/chatState.ts).
   */
  module?: string;
  /** Convex deployment URL */
  url: string;
}

export interface ConvexStateClientOptions {
  /** Existing ConvexHttpClient instance */
  client: ConvexHttpClient;
  /** Logger instance for error reporting */
  logger: Logger;
  /**
   * The module path in the app where chatState wrapper functions are exported.
   * Defaults to "chatState" (i.e., convex/chatState.ts).
   */
  module?: string;
}

export class ConvexStateAdapter implements StateAdapter {
  private readonly client: ConvexHttpClient;
  private readonly logger: Logger;
  private readonly module: string;
  private connected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(options: ConvexStateAdapterOptions | ConvexStateClientOptions) {
    if ("client" in options) {
      this.client = options.client;
    } else {
      this.client = new ConvexHttpClient(options.url);
    }
    this.logger = options.logger;
    this.module = options.module ?? "chatState";
  }

  private ref<T extends "mutation" | "query" | "action">(
    type: T,
    name: string
  ): FunctionReference<T, "public"> {
    return makeFunctionReference<T>(`${this.module}:${name}`);
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    if (!this.connectPromise) {
      this.connectPromise = Promise.resolve().then(() => {
        this.connected = true;
      });
    }

    await this.connectPromise;
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      // ConvexHttpClient is stateless — no connection to close
      this.connected = false;
      this.connectPromise = null;
    }
  }

  // ── Subscriptions ──

  async subscribe(threadId: string): Promise<void> {
    this.ensureConnected();
    await this.client.mutation(this.ref("mutation", "subscribe"), {
      threadId,
    });
  }

  async unsubscribe(threadId: string): Promise<void> {
    this.ensureConnected();
    await this.client.mutation(this.ref("mutation", "unsubscribe"), {
      threadId,
    });
  }

  async isSubscribed(threadId: string): Promise<boolean> {
    this.ensureConnected();
    return await this.client.query(this.ref("query", "isSubscribed"), {
      threadId,
    });
  }

  // ── Locks ──

  async acquireLock(threadId: string, ttlMs: number): Promise<Lock | null> {
    this.ensureConnected();
    return await this.client.mutation(this.ref("mutation", "acquireLock"), {
      threadId,
      ttlMs,
    });
  }

  async releaseLock(lock: Lock): Promise<void> {
    this.ensureConnected();
    await this.client.mutation(this.ref("mutation", "releaseLock"), {
      threadId: lock.threadId,
      token: lock.token,
    });
  }

  async extendLock(lock: Lock, ttlMs: number): Promise<boolean> {
    this.ensureConnected();
    return await this.client.mutation(this.ref("mutation", "extendLock"), {
      threadId: lock.threadId,
      token: lock.token,
      ttlMs,
    });
  }

  async forceReleaseLock(threadId: string): Promise<void> {
    this.ensureConnected();
    await this.client.mutation(this.ref("mutation", "forceReleaseLock"), {
      threadId,
    });
  }

  // ── Cache ──

  async get<T = unknown>(key: string): Promise<T | null> {
    this.ensureConnected();
    const value: string | null = await this.client.query(
      this.ref("query", "get"),
      { key }
    );
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttlMs?: number
  ): Promise<void> {
    this.ensureConnected();
    await this.client.mutation(this.ref("mutation", "set"), {
      key,
      value: JSON.stringify(value),
      ttlMs,
    });
  }

  async setIfNotExists(
    key: string,
    value: unknown,
    ttlMs?: number
  ): Promise<boolean> {
    this.ensureConnected();
    return await this.client.mutation(this.ref("mutation", "setIfNotExists"), {
      key,
      value: JSON.stringify(value),
      ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.ensureConnected();
    await this.client.mutation(this.ref("mutation", "del"), { key });
  }

  // ── Lists ──

  async appendToList(
    key: string,
    value: unknown,
    options?: { maxLength?: number; ttlMs?: number }
  ): Promise<void> {
    this.ensureConnected();
    await this.client.mutation(this.ref("mutation", "appendToList"), {
      key,
      value: JSON.stringify(value),
      maxLength: options?.maxLength,
      ttlMs: options?.ttlMs,
    });
  }

  async getList<T = unknown>(key: string): Promise<T[]> {
    this.ensureConnected();
    const items: string[] = await this.client.query(
      this.ref("query", "getList"),
      { key }
    );
    return items.map((item) => {
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    });
  }

  // ── Queues ──

  async enqueue(
    threadId: string,
    entry: QueueEntry,
    maxSize: number
  ): Promise<number> {
    this.ensureConnected();
    return await this.client.mutation(this.ref("mutation", "enqueue"), {
      threadId,
      entry: JSON.stringify(entry),
      maxSize,
    });
  }

  async dequeue(threadId: string): Promise<QueueEntry | null> {
    this.ensureConnected();
    const value: string | null = await this.client.mutation(
      this.ref("mutation", "dequeue"),
      { threadId }
    );
    if (value === null) return null;
    return JSON.parse(value) as QueueEntry;
  }

  async queueDepth(threadId: string): Promise<number> {
    this.ensureConnected();
    return await this.client.query(this.ref("query", "queueDepth"), {
      threadId,
    });
  }

  // ── Internal ──

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error(
        "ConvexStateAdapter is not connected. Call connect() first."
      );
    }
  }

  /** Get the underlying ConvexHttpClient for advanced usage. */
  getClient(): ConvexHttpClient {
    return this.client;
  }
}

/**
 * Create a Convex state adapter for the chat SDK.
 *
 * @example
 * ```ts
 * // With URL
 * const state = createConvexState({
 *   url: process.env.CONVEX_URL!,
 *   logger: console,
 * });
 *
 * // With existing client
 * import { ConvexHttpClient } from "convex/browser";
 * const client = new ConvexHttpClient(process.env.CONVEX_URL!);
 * const state = createConvexState({ client, logger: console });
 * ```
 */
export function createConvexState(
  options: ConvexStateAdapterOptions | ConvexStateClientOptions
): ConvexStateAdapter {
  return new ConvexStateAdapter(options);
}

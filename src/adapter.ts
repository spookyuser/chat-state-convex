/**
 * ConvexStateAdapter — implements the chat SDK's StateAdapter interface
 * using Convex as the storage backend.
 *
 * Two modes:
 * 1. **Inside Convex actions** (preferred): pass `ctx` + `component` to call
 *    the component directly. No wrapper functions needed.
 * 2. **Outside Convex**: uses ConvexHttpClient to call app-side wrapper functions.
 *
 * @example
 * ```ts
 * // Inside a Convex action — zero config, no wrappers needed
 * import { createConvexState } from "chat-state-convex";
 * import { components } from "./_generated/api";
 *
 * export const handleMessage = action({
 *   handler: async (ctx) => {
 *     const state = createConvexState({ ctx, component: components.chatState });
 *     await state.connect();
 *     // pass to chat SDK...
 *   },
 * });
 * ```
 */

import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference, type FunctionReference } from "convex/server";
import type { Lock, QueueEntry, StateAdapter } from "chat";
import { ChatState } from "./client.js";

// ── Option types ──

/** Use inside a Convex action — calls the component directly, no wrappers needed. */
export interface ConvexStateComponentOptions {
  /** The component reference from `components.chatState` */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any;
  /** The action context (`ctx` from your action handler) */
  ctx: {
    runMutation: (...args: any[]) => Promise<any>;
    runQuery: (...args: any[]) => Promise<any>;
  };
}

/** Use outside Convex with auto-detected or explicit URL. */
export interface ConvexStateUrlOptions {
  /** Module path for wrapper functions. Defaults to "chatState". */
  module?: string;
  /** Convex deployment URL. Auto-detected from CONVEX_CLOUD_URL / CONVEX_URL if omitted. */
  url?: string;
}

/** Use outside Convex with an existing ConvexHttpClient. */
export interface ConvexStateClientOptions {
  /** Existing ConvexHttpClient instance */
  client: ConvexHttpClient;
  /** Module path for wrapper functions. Defaults to "chatState". */
  module?: string;
}

export type ConvexStateAdapterOptions =
  | ConvexStateComponentOptions
  | ConvexStateUrlOptions
  | ConvexStateClientOptions;

// ── Internal strategy ──

interface Strategy {
  mutation(ref: any, args: any): Promise<any>;
  query(ref: any, args: any): Promise<any>;
}

class ComponentStrategy implements Strategy {
  private chatState: ChatState;
  private ctx: ConvexStateComponentOptions["ctx"];

  constructor(ctx: ConvexStateComponentOptions["ctx"], component: any) {
    this.ctx = ctx;
    this.chatState = new ChatState(component);
  }

  // For component mode, refs are the ChatState method names.
  // We route through ChatState which calls ctx.runMutation/runQuery internally.
  async mutation(_ref: any, _args: any): Promise<any> {
    throw new Error("Use direct methods");
  }
  async query(_ref: any, _args: any): Promise<any> {
    throw new Error("Use direct methods");
  }

  getChatState() {
    return this.chatState;
  }
  getCtx() {
    return this.ctx;
  }
}

class HttpStrategy implements Strategy {
  private client: ConvexHttpClient;
  private module: string;

  constructor(client: ConvexHttpClient, module: string) {
    this.client = client;
    this.module = module;
  }

  private ref<T extends "mutation" | "query">(
    type: T,
    name: string
  ): FunctionReference<T, "public"> {
    return makeFunctionReference<T>(`${this.module}:${name}`);
  }

  async mutation(name: string, args: any): Promise<any> {
    return await this.client.mutation(this.ref("mutation", name), args);
  }

  async query(name: string, args: any): Promise<any> {
    return await this.client.query(this.ref("query", name), args);
  }

  getClient() {
    return this.client;
  }
}

// ── Adapter ──

export class ConvexStateAdapter implements StateAdapter {
  private readonly strategy: ComponentStrategy | HttpStrategy;
  private connected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(options: ConvexStateAdapterOptions = {}) {
    if ("ctx" in options && "component" in options) {
      this.strategy = new ComponentStrategy(options.ctx, options.component);
    } else if ("client" in options) {
      this.strategy = new HttpStrategy(
        options.client,
        (options as ConvexStateClientOptions).module ?? "chatState"
      );
    } else {
      const opts = options as ConvexStateUrlOptions;
      const url =
        opts.url ??
        process.env.CONVEX_CLOUD_URL ??
        process.env.CONVEX_URL;
      if (!url) {
        throw new Error(
          "No Convex URL provided. Pass `url`, set CONVEX_CLOUD_URL / CONVEX_URL, or use { ctx, component } inside an action."
        );
      }
      this.strategy = new HttpStrategy(
        new ConvexHttpClient(url),
        opts.module ?? "chatState"
      );
    }
  }

  private get isComponent(): boolean {
    return this.strategy instanceof ComponentStrategy;
  }

  private get chatState(): ChatState {
    return (this.strategy as ComponentStrategy).getChatState();
  }

  private get ctx(): ConvexStateComponentOptions["ctx"] {
    return (this.strategy as ComponentStrategy).getCtx();
  }

  private get http(): HttpStrategy {
    return this.strategy as HttpStrategy;
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
      this.connected = false;
      this.connectPromise = null;
    }
  }

  // ── Subscriptions ──

  async subscribe(threadId: string): Promise<void> {
    this.ensureConnected();
    if (this.isComponent) {
      await this.chatState.subscribe(this.ctx, threadId);
    } else {
      await this.http.mutation("subscribe", { threadId });
    }
  }

  async unsubscribe(threadId: string): Promise<void> {
    this.ensureConnected();
    if (this.isComponent) {
      await this.chatState.unsubscribe(this.ctx, threadId);
    } else {
      await this.http.mutation("unsubscribe", { threadId });
    }
  }

  async isSubscribed(threadId: string): Promise<boolean> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.isSubscribed(this.ctx, threadId);
    }
    return await this.http.query("isSubscribed", { threadId });
  }

  // ── Locks ──

  async acquireLock(threadId: string, ttlMs: number): Promise<Lock | null> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.acquireLock(this.ctx, threadId, ttlMs);
    }
    return await this.http.mutation("acquireLock", { threadId, ttlMs });
  }

  async releaseLock(lock: Lock): Promise<void> {
    this.ensureConnected();
    if (this.isComponent) {
      await this.chatState.releaseLock(this.ctx, lock);
    } else {
      await this.http.mutation("releaseLock", {
        threadId: lock.threadId,
        token: lock.token,
      });
    }
  }

  async extendLock(lock: Lock, ttlMs: number): Promise<boolean> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.extendLock(this.ctx, lock, ttlMs);
    }
    return await this.http.mutation("extendLock", {
      threadId: lock.threadId,
      token: lock.token,
      ttlMs,
    });
  }

  async forceReleaseLock(threadId: string): Promise<void> {
    this.ensureConnected();
    if (this.isComponent) {
      await this.chatState.forceReleaseLock(this.ctx, threadId);
    } else {
      await this.http.mutation("forceReleaseLock", { threadId });
    }
  }

  // ── Cache ──

  async get<T = unknown>(key: string): Promise<T | null> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.get<T>(this.ctx, key);
    }
    const value: string | null = await this.http.query("get", { key });
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
    if (this.isComponent) {
      await this.chatState.set(this.ctx, key, value, ttlMs);
    } else {
      await this.http.mutation("set", {
        key,
        value: JSON.stringify(value),
        ttlMs,
      });
    }
  }

  async setIfNotExists(
    key: string,
    value: unknown,
    ttlMs?: number
  ): Promise<boolean> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.setIfNotExists(this.ctx, key, value, ttlMs);
    }
    return await this.http.mutation("setIfNotExists", {
      key,
      value: JSON.stringify(value),
      ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.ensureConnected();
    if (this.isComponent) {
      await this.chatState.delete(this.ctx, key);
    } else {
      await this.http.mutation("del", { key });
    }
  }

  // ── Lists ──

  async appendToList(
    key: string,
    value: unknown,
    options?: { maxLength?: number; ttlMs?: number }
  ): Promise<void> {
    this.ensureConnected();
    if (this.isComponent) {
      await this.chatState.appendToList(this.ctx, key, value, options);
    } else {
      await this.http.mutation("appendToList", {
        key,
        value: JSON.stringify(value),
        maxLength: options?.maxLength,
        ttlMs: options?.ttlMs,
      });
    }
  }

  async getList<T = unknown>(key: string): Promise<T[]> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.getList<T>(this.ctx, key);
    }
    const items: string[] = await this.http.query("getList", { key });
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
    if (this.isComponent) {
      return await this.chatState.enqueue(this.ctx, threadId, entry, maxSize);
    }
    return await this.http.mutation("enqueue", {
      threadId,
      entry: JSON.stringify(entry),
      maxSize,
    });
  }

  async dequeue(threadId: string): Promise<QueueEntry | null> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.dequeue<QueueEntry>(this.ctx, threadId);
    }
    const value: string | null = await this.http.mutation("dequeue", {
      threadId,
    });
    if (value === null) return null;
    return JSON.parse(value) as QueueEntry;
  }

  async queueDepth(threadId: string): Promise<number> {
    this.ensureConnected();
    if (this.isComponent) {
      return await this.chatState.queueDepth(this.ctx, threadId);
    }
    return await this.http.query("queueDepth", { threadId });
  }

  // ── Internal ──

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error(
        "ConvexStateAdapter is not connected. Call connect() first."
      );
    }
  }

  /** Get the underlying ConvexHttpClient (only available in HTTP mode). */
  getClient(): ConvexHttpClient {
    if (this.isComponent) {
      throw new Error("No HTTP client in component mode.");
    }
    return (this.strategy as HttpStrategy).getClient();
  }
}

/**
 * Create a Convex state adapter for the chat SDK.
 *
 * @example
 * ```ts
 * // Inside a Convex action (preferred) — no wrappers needed
 * const state = createConvexState({ ctx, component: components.chatState });
 *
 * // Outside Convex — auto-detect URL
 * const state = createConvexState();
 * ```
 */
export function createConvexState(
  options: ConvexStateAdapterOptions = {}
): ConvexStateAdapter {
  return new ConvexStateAdapter(options);
}

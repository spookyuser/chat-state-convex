/**
 * Class-based client for calling the chatState component from inside Convex functions.
 *
 * Usage:
 * ```ts
 * import { ChatState } from "chat-state-convex";
 * import { components } from "./_generated/api";
 *
 * const chatState = new ChatState(components.chatState);
 *
 * export const subscribe = mutation({
 *   args: { threadId: v.string() },
 *   handler: async (ctx, args) => {
 *     await chatState.subscribe(ctx, args.threadId);
 *   },
 * });
 * ```
 */

import type {
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

// Use a mapped type from the component's generated API.
// This will be typed correctly once codegen runs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentApi = any;

type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type MutationCtx = Pick<
  GenericMutationCtx<GenericDataModel>,
  "runQuery" | "runMutation"
>;
type ActionCtx = Pick<
  GenericActionCtx<GenericDataModel>,
  "runQuery" | "runMutation" | "runAction"
>;

export interface Lock {
  threadId: string;
  token: string;
  expiresAt: number;
}

export class ChatState {
  constructor(private component: ComponentApi) {}

  // ── Subscriptions ──

  async subscribe(ctx: MutationCtx, threadId: string): Promise<void> {
    await ctx.runMutation(this.component.subscriptions.subscribe, {
      threadId,
    });
  }

  async unsubscribe(ctx: MutationCtx, threadId: string): Promise<void> {
    await ctx.runMutation(this.component.subscriptions.unsubscribe, {
      threadId,
    });
  }

  async isSubscribed(ctx: QueryCtx, threadId: string): Promise<boolean> {
    return await ctx.runQuery(this.component.subscriptions.isSubscribed, {
      threadId,
    });
  }

  // ── Locks ──

  async acquireLock(
    ctx: MutationCtx,
    threadId: string,
    ttlMs: number
  ): Promise<Lock | null> {
    return await ctx.runMutation(this.component.locks.acquireLock, {
      threadId,
      ttlMs,
    });
  }

  async releaseLock(ctx: MutationCtx, lock: Lock): Promise<void> {
    await ctx.runMutation(this.component.locks.releaseLock, {
      threadId: lock.threadId,
      token: lock.token,
    });
  }

  async extendLock(
    ctx: MutationCtx,
    lock: Lock,
    ttlMs: number
  ): Promise<boolean> {
    return await ctx.runMutation(this.component.locks.extendLock, {
      threadId: lock.threadId,
      token: lock.token,
      ttlMs,
    });
  }

  async forceReleaseLock(
    ctx: MutationCtx,
    threadId: string
  ): Promise<void> {
    await ctx.runMutation(this.component.locks.forceReleaseLock, {
      threadId,
    });
  }

  // ── Cache ──

  async get<T = unknown>(ctx: QueryCtx, key: string): Promise<T | null> {
    const value = await ctx.runQuery(this.component.cache.get, { key });
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T = unknown>(
    ctx: MutationCtx,
    key: string,
    value: T,
    ttlMs?: number
  ): Promise<void> {
    await ctx.runMutation(this.component.cache.set, {
      key,
      value: JSON.stringify(value),
      ttlMs,
    });
  }

  async setIfNotExists(
    ctx: MutationCtx,
    key: string,
    value: unknown,
    ttlMs?: number
  ): Promise<boolean> {
    return await ctx.runMutation(this.component.cache.setIfNotExists, {
      key,
      value: JSON.stringify(value),
      ttlMs,
    });
  }

  async delete(ctx: MutationCtx, key: string): Promise<void> {
    await ctx.runMutation(this.component.cache.del, { key });
  }

  // ── Lists ──

  async appendToList(
    ctx: MutationCtx,
    key: string,
    value: unknown,
    options?: { maxLength?: number; ttlMs?: number }
  ): Promise<void> {
    await ctx.runMutation(this.component.cache.appendToList, {
      key,
      value: JSON.stringify(value),
      maxLength: options?.maxLength,
      ttlMs: options?.ttlMs,
    });
  }

  async getList<T = unknown>(ctx: QueryCtx, key: string): Promise<T[]> {
    const items = await ctx.runQuery(this.component.cache.getList, { key });
    return items.map((item: string) => {
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    });
  }

  // ── Queues ──

  async enqueue(
    ctx: MutationCtx,
    threadId: string,
    entry: unknown,
    maxSize: number
  ): Promise<number> {
    return await ctx.runMutation(this.component.queues.enqueue, {
      threadId,
      entry: JSON.stringify(entry),
      maxSize,
    });
  }

  async dequeue<T = unknown>(
    ctx: MutationCtx,
    threadId: string
  ): Promise<T | null> {
    const value = await ctx.runMutation(this.component.queues.dequeue, {
      threadId,
    });
    if (value === null) return null;
    return JSON.parse(value) as T;
  }

  async queueDepth(ctx: QueryCtx, threadId: string): Promise<number> {
    return await ctx.runQuery(this.component.queues.queueDepth, {
      threadId,
    });
  }
}

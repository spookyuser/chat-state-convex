/**
 * Creates a chat SDK StateAdapter backed by the chatState Convex component.
 *
 * Use inside a Convex action — pass ctx and the component reference.
 *
 * @example
 * ```ts
 * import { createStateAdapter } from "chat-state-convex";
 * import { components } from "./_generated/api";
 * import { Chat } from "chat";
 *
 * export const handleMessage = action({
 *   handler: async (ctx) => {
 *     const state = createStateAdapter(ctx, components.chatState);
 *     const chat = new Chat({ state, adapters: { whatsapp: whatsappAdapter } });
 *     // ...
 *   },
 * });
 * ```
 */

import type { Lock, QueueEntry, StateAdapter } from "chat";
import { ChatState } from "./chatState.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentApi = any;

type Ctx = {
  runMutation: (...args: any[]) => Promise<any>;
  runQuery: (...args: any[]) => Promise<any>;
};

export function createStateAdapter(
  ctx: Ctx,
  component: ComponentApi
): StateAdapter {
  const chatState = new ChatState(component);

  return {
    async connect() {},
    async disconnect() {},

    // Subscriptions
    subscribe: (threadId) => chatState.subscribe(ctx, threadId),
    unsubscribe: (threadId) => chatState.unsubscribe(ctx, threadId),
    isSubscribed: (threadId) => chatState.isSubscribed(ctx, threadId),

    // Locks
    acquireLock: (threadId, ttlMs) =>
      chatState.acquireLock(ctx, threadId, ttlMs),
    releaseLock: (lock) => chatState.releaseLock(ctx, lock),
    extendLock: (lock, ttlMs) => chatState.extendLock(ctx, lock, ttlMs),
    forceReleaseLock: (threadId) => chatState.forceReleaseLock(ctx, threadId),

    // Cache
    get: <T = unknown>(key: string) => chatState.get<T>(ctx, key),
    set: <T = unknown>(key: string, value: T, ttlMs?: number) =>
      chatState.set(ctx, key, value, ttlMs),
    setIfNotExists: (key, value, ttlMs) =>
      chatState.setIfNotExists(ctx, key, value, ttlMs),
    delete: (key) => chatState.delete(ctx, key),

    // Lists
    appendToList: (key, value, options) =>
      chatState.appendToList(ctx, key, value, options),
    getList: <T = unknown>(key: string) => chatState.getList<T>(ctx, key),

    // Queues
    enqueue: (threadId, entry, maxSize) =>
      chatState.enqueue(ctx, threadId, entry, maxSize),
    dequeue: (threadId) => chatState.dequeue<QueueEntry>(ctx, threadId),
    queueDepth: (threadId) => chatState.queueDepth(ctx, threadId),
  };
}

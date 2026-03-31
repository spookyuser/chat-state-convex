/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    cache: {
      appendToList: FunctionReference<
        "mutation",
        "internal",
        { key: string; maxLength?: number; ttlMs?: number; value: string },
        null,
        Name
      >;
      del: FunctionReference<
        "mutation",
        "internal",
        { key: string },
        null,
        Name
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: string },
        string | null,
        Name
      >;
      getList: FunctionReference<
        "query",
        "internal",
        { key: string },
        Array<string>,
        Name
      >;
      set: FunctionReference<
        "mutation",
        "internal",
        { key: string; ttlMs?: number; value: string },
        null,
        Name
      >;
      setIfNotExists: FunctionReference<
        "mutation",
        "internal",
        { key: string; ttlMs?: number; value: string },
        boolean,
        Name
      >;
    };
    locks: {
      acquireLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; ttlMs: number },
        { expiresAt: number; threadId: string; token: string } | null,
        Name
      >;
      extendLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; token: string; ttlMs: number },
        boolean,
        Name
      >;
      forceReleaseLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null,
        Name
      >;
      releaseLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; token: string },
        null,
        Name
      >;
    };
    queues: {
      dequeue: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        string | null,
        Name
      >;
      enqueue: FunctionReference<
        "mutation",
        "internal",
        { entry: string; maxSize: number; threadId: string },
        number,
        Name
      >;
      queueDepth: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        number,
        Name
      >;
    };
    subscriptions: {
      isSubscribed: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        boolean,
        Name
      >;
      subscribe: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null,
        Name
      >;
      unsubscribe: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null,
        Name
      >;
    };
  };

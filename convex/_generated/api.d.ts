/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  chatState: {
    cache: {
      appendToList: FunctionReference<
        "mutation",
        "internal",
        { key: string; maxLength?: number; ttlMs?: number; value: string },
        null
      >;
      del: FunctionReference<"mutation", "internal", { key: string }, null>;
      get: FunctionReference<
        "query",
        "internal",
        { key: string },
        string | null
      >;
      getList: FunctionReference<
        "query",
        "internal",
        { key: string },
        Array<string>
      >;
      set: FunctionReference<
        "mutation",
        "internal",
        { key: string; ttlMs?: number; value: string },
        null
      >;
      setIfNotExists: FunctionReference<
        "mutation",
        "internal",
        { key: string; ttlMs?: number; value: string },
        boolean
      >;
    };
    locks: {
      acquireLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; ttlMs: number },
        { expiresAt: number; threadId: string; token: string } | null
      >;
      extendLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; token: string; ttlMs: number },
        boolean
      >;
      forceReleaseLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null
      >;
      releaseLock: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; token: string },
        null
      >;
    };
    queues: {
      dequeue: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        string | null
      >;
      enqueue: FunctionReference<
        "mutation",
        "internal",
        { entry: string; maxSize: number; threadId: string },
        number
      >;
      queueDepth: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        number
      >;
    };
    subscriptions: {
      isSubscribed: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        boolean
      >;
      subscribe: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null
      >;
      unsubscribe: FunctionReference<
        "mutation",
        "internal",
        { threadId: string },
        null
      >;
    };
  };
};

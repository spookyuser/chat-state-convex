/**
 * App-side wrapper functions for the chatState component.
 *
 * These thin wrappers delegate to the component and are callable
 * by ConvexStateAdapter via ConvexHttpClient. The adapter expects
 * these functions at "chatState:<name>" by default.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";

// ── Subscriptions ──

export const subscribe = mutation({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.subscriptions.subscribe,
      args
    );
  },
});

export const unsubscribe = mutation({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.subscriptions.unsubscribe,
      args
    );
  },
});

export const isSubscribed = query({
  args: { threadId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.chatState.subscriptions.isSubscribed,
      args
    );
  },
});

// ── Locks ──

export const acquireLock = mutation({
  args: { threadId: v.string(), ttlMs: v.float64() },
  returns: v.union(
    v.object({
      threadId: v.string(),
      token: v.string(),
      expiresAt: v.float64(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.locks.acquireLock,
      args
    );
  },
});

export const releaseLock = mutation({
  args: { threadId: v.string(), token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.locks.releaseLock,
      args
    );
  },
});

export const extendLock = mutation({
  args: { threadId: v.string(), token: v.string(), ttlMs: v.float64() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.locks.extendLock,
      args
    );
  },
});

export const forceReleaseLock = mutation({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.locks.forceReleaseLock,
      args
    );
  },
});

// ── Cache ──

export const get = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.chatState.cache.get, args);
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    ttlMs: v.optional(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.chatState.cache.set, args);
  },
});

export const setIfNotExists = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    ttlMs: v.optional(v.float64()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.cache.setIfNotExists,
      args
    );
  },
});

export const del = mutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.chatState.cache.del, args);
  },
});

// ── Lists ──

export const appendToList = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    maxLength: v.optional(v.float64()),
    ttlMs: v.optional(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.cache.appendToList,
      args
    );
  },
});

export const getList = query({
  args: { key: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.chatState.cache.getList, args);
  },
});

// ── Queues ──

export const enqueue = mutation({
  args: {
    threadId: v.string(),
    entry: v.string(),
    maxSize: v.float64(),
  },
  returns: v.float64(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.queues.enqueue,
      args
    );
  },
});

export const dequeue = mutation({
  args: { threadId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.chatState.queues.dequeue,
      args
    );
  },
});

export const queueDepth = query({
  args: { threadId: v.string() },
  returns: v.float64(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.chatState.queues.queueDepth,
      args
    );
  },
});

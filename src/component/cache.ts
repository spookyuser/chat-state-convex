import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

export const get = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!entry) return null;

    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      return null;
    }

    return entry.value;
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
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const expiresAt = args.ttlMs ? Date.now() + args.ttlMs : undefined;

    if (existing) {
      await ctx.db.replace(existing._id, {
        key: args.key,
        value: args.value,
        expiresAt,
      });
    } else {
      await ctx.db.insert("cache", {
        key: args.key,
        value: args.value,
        expiresAt,
      });
    }
    return null;
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
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      // Check if expired
      if (existing.expiresAt !== undefined && existing.expiresAt <= Date.now()) {
        await ctx.db.delete(existing._id);
      } else {
        return false;
      }
    }

    const expiresAt = args.ttlMs ? Date.now() + args.ttlMs : undefined;
    await ctx.db.insert("cache", {
      key: args.key,
      value: args.value,
      expiresAt,
    });
    return true;
  },
});

export const del = mutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const appendToList = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    maxLength: v.optional(v.float64()),
    ttlMs: v.optional(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    let list: string[] = [];
    let shouldUpdate = false;

    if (existing) {
      const expired =
        existing.expiresAt !== undefined && existing.expiresAt <= Date.now();
      if (expired) {
        await ctx.db.delete(existing._id);
      } else {
        shouldUpdate = true;
        try {
          const parsed = JSON.parse(existing.value);
          list = Array.isArray(parsed) ? parsed : [];
        } catch {
          list = [];
        }
      }
    }

    list.push(args.value);

    if (args.maxLength && list.length > args.maxLength) {
      list = list.slice(list.length - args.maxLength);
    }

    const expiresAt = args.ttlMs ? Date.now() + args.ttlMs : undefined;
    const doc = { key: args.key, value: JSON.stringify(list), expiresAt };

    if (shouldUpdate && existing) {
      await ctx.db.replace(existing._id, doc);
    } else {
      await ctx.db.insert("cache", doc);
    }
    return null;
  },
});

export const getList = query({
  args: { key: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("cache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!entry) return [];

    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      return [];
    }

    try {
      const parsed = JSON.parse(entry.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
});

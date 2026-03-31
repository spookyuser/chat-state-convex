import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

const lockReturnValidator = v.union(
  v.object({
    threadId: v.string(),
    token: v.string(),
    expiresAt: v.float64(),
  }),
  v.null()
);

export const acquireLock = mutation({
  args: { threadId: v.string(), ttlMs: v.float64() },
  returns: lockReturnValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("locks")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    const now = Date.now();

    // If a non-expired lock exists, acquisition fails
    if (existing && existing.expiresAt > now) {
      return null;
    }

    // Clean up expired lock if present
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    const token = `cvx_${now}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = now + args.ttlMs;

    await ctx.db.insert("locks", {
      threadId: args.threadId,
      token,
      expiresAt,
    });

    return { threadId: args.threadId, token, expiresAt };
  },
});

export const releaseLock = mutation({
  args: { threadId: v.string(), token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("locks")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    if (existing && existing.token === args.token) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const extendLock = mutation({
  args: { threadId: v.string(), token: v.string(), ttlMs: v.float64() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("locks")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    if (!existing || existing.token !== args.token) {
      return false;
    }

    if (existing.expiresAt < Date.now()) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.patch(existing._id, {
      expiresAt: Date.now() + args.ttlMs,
    });
    return true;
  },
});

export const forceReleaseLock = mutation({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("locks")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

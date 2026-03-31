import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

export const subscribe = mutation({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();
    if (!existing) {
      await ctx.db.insert("subscriptions", { threadId: args.threadId });
    }
    return null;
  },
});

export const unsubscribe = mutation({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const isSubscribed = query({
  args: { threadId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();
    return existing !== null;
  },
});

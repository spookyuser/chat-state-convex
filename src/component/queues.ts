import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

export const enqueue = mutation({
  args: {
    threadId: v.string(),
    entry: v.string(),
    maxSize: v.float64(),
  },
  returns: v.float64(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("queues")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    let entries: string[];

    if (existing) {
      entries = [...existing.entries, args.entry];
    } else {
      entries = [args.entry];
    }

    // Trim to maxSize (keep newest)
    if (entries.length > args.maxSize) {
      entries = entries.slice(entries.length - args.maxSize);
    }

    if (existing) {
      await ctx.db.patch(existing._id, { entries });
    } else {
      await ctx.db.insert("queues", {
        threadId: args.threadId,
        entries,
      });
    }

    return entries.length;
  },
});

export const dequeue = mutation({
  args: { threadId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("queues")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    if (!existing || existing.entries.length === 0) {
      return null;
    }

    const [first, ...rest] = existing.entries;

    if (rest.length === 0) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, { entries: rest });
    }

    return first;
  },
});

export const queueDepth = query({
  args: { threadId: v.string() },
  returns: v.float64(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("queues")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    return existing?.entries.length ?? 0;
  },
});

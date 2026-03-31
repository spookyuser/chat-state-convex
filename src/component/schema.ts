import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  subscriptions: defineTable({
    threadId: v.string(),
  }).index("by_threadId", ["threadId"]),

  locks: defineTable({
    threadId: v.string(),
    token: v.string(),
    expiresAt: v.float64(),
  }).index("by_threadId", ["threadId"]),

  cache: defineTable({
    key: v.string(),
    value: v.string(),
    expiresAt: v.optional(v.float64()),
  }).index("by_key", ["key"]),

  queues: defineTable({
    threadId: v.string(),
    entries: v.array(v.string()),
  }).index("by_threadId", ["threadId"]),
});

/**
 * Example: Using ConvexStateAdapter inside a Convex action
 *
 * This is the recommended approach — component mode, no wrapper functions needed.
 */

// import { action } from "./_generated/server";
// import { components } from "./_generated/api";
// import { createConvexState } from "chat-state-convex";
// import { Chat } from "chat";
//
// export const handleMessage = action({
//   handler: async (ctx) => {
//     const state = createConvexState({ ctx, component: components.chatState });
//     await state.connect();
//
//     const chat = new Chat({
//       state,
//       adapters: { slack: slackAdapter },
//     });
//
//     // ...
//   },
// });

/**
 * Example: Using ChatState class directly (without the adapter)
 *
 * For direct access to component functions from your own Convex mutations/queries.
 */

// import { ChatState } from "chat-state-convex";
// import { components } from "./_generated/api";
// import { mutation, query } from "./_generated/server";
// import { v } from "convex/values";
//
// const chatState = new ChatState(components.chatState);
//
// export const subscribe = mutation({
//   args: { threadId: v.string() },
//   handler: async (ctx, args) => {
//     await chatState.subscribe(ctx, args.threadId);
//   },
// });
//
// export const isSubscribed = query({
//   args: { threadId: v.string() },
//   handler: async (ctx, args) => {
//     return await chatState.isSubscribed(ctx, args.threadId);
//   },
// });

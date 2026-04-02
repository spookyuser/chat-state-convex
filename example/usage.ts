/**
 * Example: Using the chat SDK with Convex inside an action
 */

// import { action } from "./_generated/server";
// import { components } from "./_generated/api";
// import { createStateAdapter } from "chat-state-convex";
// import { Chat } from "chat";
//
// export const handleMessage = action({
//   handler: async (ctx) => {
//     const state = createStateAdapter(ctx, components.chatState);
//     const chat = new Chat({
//       state,
//       userName: "Bot",
//       adapters: { whatsapp: whatsappAdapter },
//     });
//     // ...
//   },
// });

/**
 * Example: Using ChatState class directly in your own mutations/queries
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

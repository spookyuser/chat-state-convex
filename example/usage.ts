/**
 * Example: Using ConvexStateAdapter with the chat SDK
 */

import { createConvexState } from "chat-state-convex";

// Create the adapter — points to your Convex deployment
const state = createConvexState({
  url: process.env.CONVEX_URL!,
  logger: console,
  // module defaults to "chatState", matching convex/chatState.ts
});

// Use it with the chat SDK
// import { Chat } from "chat";
//
// const chat = new Chat({
//   state,
//   adapters: { slack: slackAdapter },
// });
//
// await chat.start();

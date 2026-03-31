/**
 * Example: Using ConvexStateAdapter with the chat SDK
 */

import { createConvexState } from "chat-state-convex";

// URL auto-detected from CONVEX_CLOUD_URL or CONVEX_URL
const state = createConvexState();

// Use it with the chat SDK
// import { Chat } from "chat";
//
// const chat = new Chat({
//   state,
//   adapters: { slack: slackAdapter },
// });
//
// await chat.start();

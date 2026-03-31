/**
 * Example: Using ConvexStateAdapter inside a Convex action
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

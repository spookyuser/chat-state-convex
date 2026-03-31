import { defineApp } from "convex/server";
import chatState from "chat-state-convex/convex.config.js";

const app = defineApp();
app.use(chatState);

export default app;

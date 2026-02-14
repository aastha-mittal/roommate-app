import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { matchRouter } from "./routes/match.js";
import { chatRouter } from "./routes/chat.js";
import { initChatSocket } from "./chat/socket.js";

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/match", matchRouter);
app.use("/api/chat", chatRouter);

initChatSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

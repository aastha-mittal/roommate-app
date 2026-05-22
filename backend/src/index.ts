import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { matchRouter } from "./routes/match.js";
import { chatRouter } from "./routes/chat.js";
import { housingRouter } from "./routes/housing.js";
import { initChatSocket } from "./chat/socket.js";

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/** Browsers opening the API port see this; API clients get JSON. The UI runs on FRONTEND_URL (Vite in dev). */
app.get("/", (req, res) => {
  const accept = req.headers.accept ?? "";
  if (accept.includes("text/html")) {
    return res.redirect(302, FRONTEND_URL);
  }
  return res.json({
    service: "roommate-match-api",
    ui: FRONTEND_URL,
    health: "/health",
    api: "/api",
  });
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/match", matchRouter);
app.use("/api/chat", chatRouter);
app.use("/api/housing", housingRouter);

// Catch-all for API JSON errors (avoids blank "Internal Server Error" HTML on unhandled async errors)
app.use("/api", (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api]", err);
  const message = err instanceof Error ? err.message : "Server error";
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error", detail: message });
  }
});

initChatSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

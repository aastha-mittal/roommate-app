import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

export function initChatSocket(httpServer: import("http").Server) {
  const io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL },
    path: "/ws",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token as string, JWT_SECRET) as { userId: string };
      (socket as unknown as { userId: string }).userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as unknown as { userId: string }).userId;
    socket.join(`user:${userId}`);

    socket.on("message:send", async (payload: { matchId: string; body: string }) => {
      const { matchId, body } = payload;
      if (!matchId || typeof body !== "string" || !body.trim()) return;
      const match = await prisma.match.findFirst({
        where: { id: matchId, OR: [{ userAId: userId }, { userBId: userId }] },
      });
      if (!match) return;
      const receiverId = match.userAId === userId ? match.userBId : match.userAId;
      const message = await prisma.message.create({
        data: { matchId, senderId: userId, receiverId, body: body.trim() },
        include: { sender: { select: { id: true, email: true } } },
      });
      io.to(`user:${receiverId}`).emit("message:new", message);
      socket.emit("message:sent", message);
    });

    socket.on("typing:start", (payload: { matchId: string }) => {
      const matchId = payload?.matchId;
      if (!matchId) return;
      socket.broadcast.emit("typing:start", { matchId, userId });
    });
    socket.on("typing:stop", (payload: { matchId: string }) => {
      const matchId = payload?.matchId;
      if (!matchId) return;
      socket.broadcast.emit("typing:stop", { matchId, userId });
    });
  });

  return io;
}

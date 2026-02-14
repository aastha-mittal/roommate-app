import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const chatRouter = Router();
chatRouter.use(requireAuth);

chatRouter.get("/matches/:matchId/messages", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const matchId = req.params.matchId;
  const match = await prisma.match.findFirst({
    where: { id: matchId, OR: [{ userAId: userId }, { userBId: userId }] },
  });
  if (!match) return res.status(404).json({ error: "Match not found" });

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, email: true } } },
  });
  return res.json({ messages });
});

chatRouter.post("/matches/:matchId/messages", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const matchId = req.params.matchId;
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body) return res.status(400).json({ error: "Message body required" });

  const match = await prisma.match.findFirst({
    where: { id: matchId, OR: [{ userAId: userId }, { userBId: userId }] },
  });
  if (!match) return res.status(404).json({ error: "Match not found" });

  const receiverId = match.userAId === userId ? match.userBId : match.userAId;
  const message = await prisma.message.create({
    data: { matchId, senderId: userId, receiverId, body },
    include: { sender: { select: { id: true, email: true } } },
  });
  return res.status(201).json(message);
});

chatRouter.patch("/messages/:messageId/read", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const messageId = req.params.messageId;
  const msg = await prisma.message.findFirst({
    where: { id: messageId, receiverId: userId },
  });
  if (!msg) return res.status(404).json({ error: "Message not found" });
  await prisma.message.update({ where: { id: messageId }, data: { read: true } });
  return res.json({ read: true });
});

export { chatRouter };

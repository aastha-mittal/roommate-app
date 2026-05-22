import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "./prisma.js";
import { authConfig } from "../config/auth.js";

export function signAuthToken(user: { id: string; email: string }) {
  const expiresIn = authConfig.jwtExpiresIn as SignOptions["expiresIn"];
  return jwt.sign({ userId: user.id, email: user.email }, authConfig.jwtSecret, { expiresIn });
}

export async function findOrCreateCmuUser(identity: {
  email: string;
  andrewId: string | null;
  displayName: string | null;
}) {
  let user = await prisma.user.findUnique({
    where: { email: identity.email },
    include: { profile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: identity.email,
        andrewId: identity.andrewId,
        authProvider: "CMU_SAML",
        passwordHash: null,
        lastActiveAt: new Date(),
        profile: {
          create: {
            displayName: identity.displayName ?? undefined,
          },
        },
      },
      include: { profile: true },
    });
    return user;
  }

  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      andrewId: identity.andrewId ?? user.andrewId,
      authProvider: "CMU_SAML",
      lastActiveAt: new Date(),
    },
    include: { profile: true },
  });

  if (!user.profile) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: identity.displayName ?? undefined,
      },
    });
    user = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true },
    });
  } else if (identity.displayName && !user.profile.displayName) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { displayName: identity.displayName },
    });
    user.profile.displayName = identity.displayName;
  }

  return user;
}

export function userToAuthPayload(user: { id: string; email: string; profile: { onboardingComplete: boolean } | null }) {
  return {
    id: user.id,
    email: user.email,
    onboardingComplete: user.profile?.onboardingComplete ?? false,
  };
}

import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { authConfig, isCmuSamlConfigured } from "../config/auth.js";
import { createSamlClient, extractCmuIdentity } from "../auth/cmuSaml.js";
import { findOrCreateCmuUser, signAuthToken, userToAuthPayload } from "../lib/authUser.js";

const authRouter = Router();

const CMU_EMAIL = /@(cmu|andrew\.cmu)\.edu$/i;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.use(authLimiter);

authRouter.get("/config", (_req, res) => {
  return res.json({
    cmuSsoEnabled: isCmuSamlConfigured(),
    cmuLoginUrl: isCmuSamlConfigured() ? "/api/auth/cmu/login" : null,
    devPasswordLogin: authConfig.devPasswordLogin,
  });
});

/** Redirect to CMU Web Login (official Shibboleth SSO) */
authRouter.get("/cmu/login", async (req, res) => {
  try {
    if (!isCmuSamlConfigured()) {
      return res.status(503).json({
        error: "CMU SSO is not configured. Set CMU_SAML_* env vars and register with CMU IT.",
      });
    }
    const relay = typeof req.query.returnTo === "string" ? req.query.returnTo : "/";
    const saml = createSamlClient();
    const url = await saml.getAuthorizeUrlAsync(relay, undefined, {});
    return res.redirect(url);
  } catch (err) {
    console.error("[auth cmu/login]", err);
    return res.status(500).json({ error: "Could not start CMU login" });
  }
});

/** SAML assertion consumer — CMU posts here after login */
authRouter.post("/cmu/callback", async (req, res) => {
  try {
    if (!isCmuSamlConfigured()) {
      return res.status(503).send("CMU SSO not configured");
    }
    const saml = createSamlClient();
    const { profile } = await saml.validatePostResponseAsync(req.body);
    const identity = extractCmuIdentity(profile as Record<string, unknown>);
    const user = await findOrCreateCmuUser(identity);
    const token = signAuthToken(user);
    const relay =
      typeof req.body?.RelayState === "string" && req.body.RelayState.startsWith("/")
        ? req.body.RelayState
        : "/";
    const redirect = new URL("/auth/callback", authConfig.frontendUrl);
    redirect.searchParams.set("token", token);
    redirect.searchParams.set("next", relay);
    return res.redirect(302, redirect.toString());
  } catch (err) {
    console.error("[auth cmu/callback]", err);
    const redirect = new URL("/login", authConfig.frontendUrl);
    redirect.searchParams.set("error", "cmu_login_failed");
    return res.redirect(302, redirect.toString());
  }
});

/** SP metadata for CMU IT registration */
authRouter.get("/cmu/metadata", (_req, res) => {
  try {
    if (!isCmuSamlConfigured()) {
      return res.status(503).json({ error: "CMU SAML not configured" });
    }
    const saml = createSamlClient();
    res.type("application/xml");
    return res.send(saml.generateServiceProviderMetadata(null, authConfig.cmuSaml.publicCert));
  } catch (err) {
    console.error("[auth cmu/metadata]", err);
    return res.status(500).json({ error: "Metadata unavailable" });
  }
});

const registerSchema = z.object({
  email: z
    .string()
    .email()
    .refine((e) => CMU_EMAIL.test(e), "Must be a valid CMU email"),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/register", async (req, res) => {
  if (!authConfig.devPasswordLogin) {
    return res.status(403).json({ error: "Registration is disabled. Sign in with CMU." });
  }
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        authProvider: "PASSWORD",
      },
      select: { id: true, email: true },
    });
    const profile = await prisma.profile.create({
      data: { userId: user.id },
    });
    const token = signAuthToken(user);
    return res.status(201).json({
      user: userToAuthPayload({ id: user.id, email: user.email, profile }),
      token,
    });
  } catch (err) {
    console.error("[auth register]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return res.status(500).json({ error: "Registration failed", detail: message });
  }
});

authRouter.post("/login", async (req, res) => {
  if (!authConfig.devPasswordLogin) {
    return res.status(403).json({ error: "Password login is disabled. Use CMU sign-in." });
  }
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
    if (!user?.passwordHash) {
      return res.status(401).json({ error: "Use CMU sign-in for this account" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.profile) {
      await prisma.profile.create({ data: { userId: user.id } });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    const token = signAuthToken(user);
    return res.json({
      user: userToAuthPayload(user),
      token,
    });
  } catch (err) {
    console.error("[auth login]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return res.status(500).json({ error: "Login failed", detail: message });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, profile: { select: { onboardingComplete: true } } },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    return res.json(userToAuthPayload(user));
  } catch (err) {
    console.error("[auth me]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return res.status(500).json({ error: "Could not load user", detail: message });
  }
});

export { authRouter };

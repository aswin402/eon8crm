import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth } from "../../middleware/rbac";
import { JWT_SECRET } from "../../config/env";

const authRouter = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const parseResult = loginSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json({ error: "Validation failed", details: parseResult.error.issues }, 400);
  }

  const { email, password } = parseResult.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    return c.json({ error: "Invalid credentials or account deactivated" }, 401);
  }

  const isPasswordValid = await Bun.password.verify(password, user.passwordHash);
  if (!isPasswordValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiration
  };

  const token = await sign(tokenPayload, JWT_SECRET, "HS256");

  // Also set HTTP-only cookie
  const isProduction = process.env.NODE_ENV === "production";
  const cookieFlags = isProduction
    ? "Path=/; HttpOnly; Secure; SameSite=None"
    : "Path=/; HttpOnly; SameSite=Lax";
  c.header(
    "Set-Cookie",
    `eon8_token=${token}; ${cookieFlags}; Max-Age=${60 * 60 * 24 * 7}`
  );

  return c.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      internalCostRate: user.internalCostRate,
      billableRate: user.billableRate,
    },
  });
});

authRouter.get("/me", requireAuth, async (c) => {
  const authUser = c.get("user");

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatarUrl: true,
      internalCostRate: true,
      billableRate: true,
      createdAt: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});

authRouter.post("/logout", (c) => {
  c.header("Set-Cookie", "eon8_token=; Path=/; HttpOnly; Max-Age=0");
  return c.json({ message: "Logged out successfully" });
});

export { authRouter };

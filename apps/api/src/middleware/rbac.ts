import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { Context, Next } from "hono";

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUserPayload;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "eon8crm-super-secret-jwt-key-change-in-production-2026";

export const requireAuth = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    // Check cookie fallback
    const cookie = c.req.header("Cookie");
    if (cookie) {
      const match = cookie.match(/eon8_token=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) {
    return c.json({ error: "Unauthorized: Missing authentication token" }, 401);
  }

  try {
    const payload = (await verify(token, JWT_SECRET, "HS256")) as unknown as AuthUserPayload;
    c.set("user", payload);
    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }
});

export const requireRole = (allowedRoles: string[]) => {
  return createMiddleware(async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized: Authentication required" }, 401);
    }

    if (user.role === "SUPER_ADMIN") {
      // Super Admin bypasses all checks
      return await next();
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          error: `Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]. Current role: ${user.role}`,
        },
        403
      );
    }

    await next();
  });
};

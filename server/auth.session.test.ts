import { describe, expect, it } from "vitest";
import { appRouter, SESSION_MAX_AGE_MS } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createAuthenticatedContext(): { ctx: TrpcContext; cookies: CookieCall[] } {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: {
      id: 1,
      legacyOpenId: null,
      legacyLoginMethod: null,
      email: "sample@example.com",
      name: "Sample User",
      passwordHash: "hash",
      role: "user",
      isActive: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, cookies };
}

describe("auth.me", () => {
  it("renova a sessão segura por sete dias para um utilizador autenticado", async () => {
    const { ctx, cookies } = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toMatchObject({ id: 1, email: "sample@example.com" });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.value.length).toBeGreaterThan(20);
    expect(cookies[0]?.options).toMatchObject({
      maxAge: SESSION_MAX_AGE_MS,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

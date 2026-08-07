import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";
import { ENV } from "./env";

type LocalSessionPayload = {
  userId: number;
};

export type AuthenticatedUser = User;

class LocalAuthService {
  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(userId: number): Promise<string> {
    return new SignJWT({ userId } satisfies LocalSessionPayload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(this.getSessionSecret());
  }

  private async verifySession(token: string | undefined): Promise<LocalSessionPayload | null> {
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });
      const userId = payload.userId;
      if (typeof userId !== "number" || !Number.isInteger(userId)) return null;
      return { userId };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;
    const session = await this.verifySession(cookies[COOKIE_NAME] ?? bearerToken);

    if (!session) throw new Error("Sessão inválida");

    const user = await db.getUserById(session.userId);
    if (!user || !user.isActive) throw new Error("Conta indisponível");
    return user;
  }
}

export const sdk = new LocalAuthService();

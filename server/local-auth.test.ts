import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  verifyPassword: vi.fn(),
  updateLastSignedIn: vi.fn(),
  registerUserFromInvitation: vi.fn(),
  listUsers: vi.fn(),
  listInvitations: vi.fn(),
  updateUserRole: vi.fn(),
  setUserActive: vi.fn(),
  getAllRounds: vi.fn(),
  getRound: vi.fn(),
  getRoundByNumber: vi.fn(),
  createRound: vi.fn(),
  createMatches: vi.fn(),
  getMatchesByRound: vi.fn(),
  updateMatchResult: vi.fn(),
  getPredictionsByRoundAndUser: vi.fn(),
  createOrUpdatePrediction: vi.fn(),
  getPredictionsByRound: vi.fn(),
  getStandings: vi.fn(),
  calculateRoundWinner: vi.fn(),
  createEmailNotification: vi.fn(),
  createInvitation: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn(),
  },
}));

import { appRouter } from "./routers";
import * as db from "./db";
import { sdk } from "./_core/sdk";

const sampleUser: User = {
  id: 7,
  legacyOpenId: null,
  legacyLoginMethod: null,
  name: "Apostador de Teste",
  email: "apostador@example.com",
  passwordHash: "password-hash",
  role: "user",
  isActive: true,
  isSuperAdmin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: null,
};

function context(user: User | null = null) {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      get: () => "liga.test",
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

describe("autenticação local", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria uma sessão local válida após login por email e password", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(sampleUser);
    vi.mocked(db.verifyPassword).mockResolvedValue(true);
    vi.mocked(sdk.createSessionToken).mockResolvedValue("session-token");
    const { ctx, cookies } = context();

    const result = await appRouter.createCaller(ctx).auth.login({
      email: sampleUser.email,
      password: "password-segura",
    });

    expect(result.user.email).toBe(sampleUser.email);
    expect(db.updateLastSignedIn).toHaveBeenCalledWith(sampleUser.id);
    expect(cookies[0]?.value).toBe("session-token");
  });

  it("exige um convite válido para criar uma conta", async () => {
    vi.mocked(db.registerUserFromInvitation).mockResolvedValue(sampleUser);
    vi.mocked(sdk.createSessionToken).mockResolvedValue("session-token");
    const { ctx } = context();

    await appRouter.createCaller(ctx).auth.register({
      name: "Apostador de Teste",
      email: sampleUser.email,
      password: "password-segura",
      invitationToken: "a".repeat(64),
    });

    expect(db.registerUserFromInvitation).toHaveBeenCalledWith({
      name: "Apostador de Teste",
      email: sampleUser.email,
      password: "password-segura",
      invitationToken: "a".repeat(64),
    });
  });

  it("impede um administrador normal de emitir convites", async () => {
    const normalAdmin: User = { ...sampleUser, role: "admin", isSuperAdmin: false };
    const { ctx } = context(normalAdmin);

    await expect(
      appRouter.createCaller(ctx).invitations.create({ email: "novo@example.com", role: "user" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite que um administrador submeta os seus próprios palpites", async () => {
    const adminUser: User = { ...sampleUser, role: "admin", isSuperAdmin: true };
    vi.mocked(db.createOrUpdatePrediction).mockResolvedValue({} as never);
    const { ctx } = context(adminUser);

    await appRouter.createCaller(ctx).predictions.submit({ matchId: 11, prediction: "X" });

    expect(db.createOrUpdatePrediction).toHaveBeenCalledWith(11, adminUser.id, "X");
  });
});

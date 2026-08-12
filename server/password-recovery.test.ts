import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  setTemporaryPassword: vi.fn(),
  changeOwnPassword: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";

const participant: User = {
  id: 16,
  legacyOpenId: null,
  legacyLoginMethod: null,
  name: "Apostador de Teste",
  email: "apostador@example.com",
  passwordHash: "hash",
  role: "user",
  isActive: true,
  isSuperAdmin: false,
  mustChangePassword: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: null,
};

function context(user: User) {
  return {
    user,
    req: { protocol: "https", headers: {}, get: () => "liga.test" } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as TrpcContext["res"],
  } satisfies TrpcContext;
}

describe("recuperação manual de palavra-passe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite ao administrador definir uma palavra-passe provisória", async () => {
    vi.mocked(db.setTemporaryPassword).mockResolvedValue();
    const admin = { ...participant, id: 2, role: "admin" as const };

    await appRouter.createCaller(context(admin)).users.setTemporaryPassword({ userId: participant.id, temporaryPassword: "provisoria-segura" });

    expect(db.setTemporaryPassword).toHaveBeenCalledWith(participant.id, "provisoria-segura");
  });

  it("permite ao participante substituir a palavra-passe provisória", async () => {
    vi.mocked(db.changeOwnPassword).mockResolvedValue();

    await appRouter.createCaller(context(participant)).auth.changeTemporaryPassword({ password: "nova-password-segura" });

    expect(db.changeOwnPassword).toHaveBeenCalledWith(participant.id, "nova-password-segura");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  updateUserProfile: vi.fn(),
  deleteInvitation: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";

const administrator: User = {
  id: 3,
  legacyOpenId: null,
  legacyLoginMethod: null,
  name: "Administrador",
  email: "admin@example.com",
  passwordHash: "hash",
  role: "admin",
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

describe("gestão de nomes e convites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite ao administrador atualizar nome e acesso de um participante", async () => {
    vi.mocked(db.updateUserProfile).mockResolvedValue();

    await appRouter.createCaller(context(administrator)).users.updateProfile({ userId: 19, name: "Novo Nome", role: "user" });

    expect(db.updateUserProfile).toHaveBeenCalledWith(19, { name: "Novo Nome", role: "user" });
  });

  it("permite apenas ao super administrador apagar um convite", async () => {
    vi.mocked(db.deleteInvitation).mockResolvedValue();
    const superAdmin = { ...administrator, id: 1, isSuperAdmin: true };

    await appRouter.createCaller(context(superAdmin)).invitations.delete({ invitationId: 11 });
    expect(db.deleteInvitation).toHaveBeenCalledWith(11);

    await expect(appRouter.createCaller(context(administrator)).invitations.delete({ invitationId: 11 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

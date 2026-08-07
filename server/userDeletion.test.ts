import { describe, expect, it } from "vitest";
import { assertUserCanBeDeleted } from "./userDeletion";

const SUPER_ADMIN_EMAIL = "ricardodonascimento@gmail.com";

describe("proteção de eliminação de utilizadores", () => {
  it("permite apagar outro apostador normal", () => {
    expect(() => assertUserCanBeDeleted({ id: 2, email: "jogador@exemplo.com", isSuperAdmin: false }, 1, SUPER_ADMIN_EMAIL)).not.toThrow();
  });

  it("bloqueia apagar a própria conta e o super administrador", () => {
    expect(() => assertUserCanBeDeleted({ id: 1, email: "admin@exemplo.com", isSuperAdmin: false }, 1, SUPER_ADMIN_EMAIL)).toThrow("própria conta");
    expect(() => assertUserCanBeDeleted({ id: 2, email: SUPER_ADMIN_EMAIL, isSuperAdmin: true }, 1, SUPER_ADMIN_EMAIL)).toThrow("super administrador");
  });
});

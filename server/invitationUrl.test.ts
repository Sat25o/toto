import { describe, expect, it } from "vitest";
import { buildInvitationUrl } from "./invitationUrl";

describe("link de convite", () => {
  it("usa sempre o domínio público e preserva email e token", () => {
    expect(buildInvitationUrl(" Jogador+1@Exemplo.com ", "token-seguro")).toBe(
      "https://tototalho.me/register?email=jogador%2B1%40exemplo.com&token=token-seguro",
    );
  });
});

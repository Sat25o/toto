import { describe, expect, it } from "vitest";
import { formatRoundPrize } from "./roundPrize";

describe("formatRoundPrize", () => {
  it("formata o valor acumulado do prémio em euros", () => {
    expect(formatRoundPrize("170.00")).toBe("170 €");
    expect(formatRoundPrize("510.50")).toBe("510,5 €");
  });

  it("não apresenta valores de prémio indisponíveis ou inválidos", () => {
    expect(formatRoundPrize(null)).toBeNull();
    expect(formatRoundPrize(undefined)).toBeNull();
    expect(formatRoundPrize("invalido")).toBeNull();
  });
});

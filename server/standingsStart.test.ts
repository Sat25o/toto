import { describe, expect, it } from "vitest";
import { STANDINGS_START_ROUND, isRoundIncludedInStandings } from "../shared/league";

describe("início da classificação", () => {
  it("inicia a contagem na Jornada 2", () => {
    expect(STANDINGS_START_ROUND).toBe(2);
    expect(isRoundIncludedInStandings(1)).toBe(false);
    expect(isRoundIncludedInStandings(2)).toBe(true);
    expect(isRoundIncludedInStandings(3)).toBe(true);
  });
});

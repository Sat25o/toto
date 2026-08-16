import { describe, expect, it } from "vitest";
import { assertRoundCanBeSettled, getWinnerIdsForValidMatches } from "./postponedMatchSettlement";

describe("fecho de jornada com jogo adiado", () => {
  const matches = [
    { id: 1, isPostponed: false, result: "1" as const },
    { id: 2, isPostponed: false, result: "X" as const },
    { id: 3, isPostponed: true, result: null },
    { id: 4, isPostponed: false, result: "2" as const },
    { id: 5, isPostponed: false, result: "1" as const },
    { id: 6, isPostponed: false, result: "X" as const },
  ];

  it("considera apenas os cinco jogos válidos", () => {
    expect(assertRoundCanBeSettled(matches)).toHaveLength(5);
    expect(getWinnerIdsForValidMatches(new Map([[10, 5], [11, 4]]), 5)).toEqual([10]);
  });

  it("exige resultados apenas nos jogos que não foram adiados", () => {
    expect(() => assertRoundCanBeSettled([{ id: 1, isPostponed: false, result: null }])).toThrow("jogos válidos");
  });
});

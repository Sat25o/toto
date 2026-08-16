import { describe, expect, it } from "vitest";
import { assertRoundCanBeSettled, getValidSettlementMatches, getWinnerIdsForValidMatches } from "./postponedMatchSettlement";

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

  it("ativa o jogo suplente quando um único jogo principal é adiado", () => {
    const matchesWithBackup = [
      { id: 1, isPostponed: false, isBackup: false, result: "1" as const },
      { id: 2, isPostponed: true, isBackup: false, result: null },
      { id: 3, isPostponed: false, isBackup: false, result: "X" as const },
      { id: 4, isPostponed: false, isBackup: false, result: "2" as const },
      { id: 5, isPostponed: false, isBackup: false, result: "1" as const },
      { id: 6, isPostponed: false, isBackup: false, result: "X" as const },
      { id: 7, isPostponed: false, isBackup: true, result: "2" as const },
    ];

    expect(getValidSettlementMatches(matchesWithBackup)).toHaveLength(6);
    expect(assertRoundCanBeSettled(matchesWithBackup)).toHaveLength(6);
  });

  it("fecha pelos jogos válidos quando são adiados dois jogos principais", () => {
    const matchesWithMultiplePostponements = [
      { id: 1, isPostponed: true, isBackup: false, result: null },
      { id: 2, isPostponed: true, isBackup: false, result: null },
      { id: 3, isPostponed: false, isBackup: false, result: "X" as const },
      { id: 4, isPostponed: false, isBackup: false, result: "2" as const },
      { id: 5, isPostponed: false, isBackup: false, result: "1" as const },
      { id: 6, isPostponed: false, isBackup: false, result: "X" as const },
      { id: 7, isPostponed: false, isBackup: true, result: "2" as const },
    ];

    expect(assertRoundCanBeSettled(matchesWithMultiplePostponements).map(match => match.id)).toEqual([3, 4, 5, 6, 7]);
    expect(getWinnerIdsForValidMatches(new Map([[10, 5], [11, 4]]), 5)).toEqual([10]);
  });
});

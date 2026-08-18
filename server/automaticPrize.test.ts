import { describe, expect, it } from "vitest";
import { calculateAutomaticRoundPrize } from "./automaticPrize";

describe("prémio automático por jornada", () => {
  it("começa com 170 € e acumula 170 € → 340 € → 510 € sem vencedores", () => {
    expect(calculateAutomaticRoundPrize()).toMatchObject({ basePrizeAmount: 170, carriedPrizeAmount: 0, totalPrizeAmount: 170 });
    expect(calculateAutomaticRoundPrize({ isSettled: true, prizeRolledOver: false, winnerCount: 0, prizeAmount: 170 })).toMatchObject({ carriedPrizeAmount: 170, totalPrizeAmount: 340 });
    expect(calculateAutomaticRoundPrize({ isSettled: true, prizeRolledOver: false, winnerCount: 0, prizeAmount: 340 })).toMatchObject({ carriedPrizeAmount: 340, totalPrizeAmount: 510 });
  });

  it("recomeça em 170 € depois de existir vencedor", () => {
    expect(calculateAutomaticRoundPrize({ isSettled: true, prizeRolledOver: false, winnerCount: 1, prizeAmount: 510 })).toMatchObject({ carriedPrizeAmount: 0, totalPrizeAmount: 170 });
  });

  it("soma o valor base definido pelo administrador ao acumulado anterior", () => {
    expect(calculateAutomaticRoundPrize(
      { isSettled: true, prizeRolledOver: false, winnerCount: 0, prizeAmount: 340 },
      150,
    )).toMatchObject({ basePrizeAmount: 150, carriedPrizeAmount: 340, totalPrizeAmount: 490 });
  });
});

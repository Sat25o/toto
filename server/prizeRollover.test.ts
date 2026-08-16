import { describe, expect, it } from "vitest";
import { getPrizeCarryOver } from "./prizeRollover";

describe("acumulação do prémio", () => {
  it("leva o prémio de uma jornada fechada sem vencedores para a seguinte", () => {
    expect(getPrizeCarryOver({ isSettled: true, prizeRolledOver: false, winnerCount: 0, prizeAmount: 25 })).toBe(25);
  });

  it("não duplica prémios já acumulados nem transfere jornadas com vencedores", () => {
    expect(getPrizeCarryOver({ isSettled: true, prizeRolledOver: true, winnerCount: 0, prizeAmount: 25 })).toBe(0);
    expect(getPrizeCarryOver({ isSettled: true, prizeRolledOver: false, winnerCount: 1, prizeAmount: 25 })).toBe(0);
  });
});

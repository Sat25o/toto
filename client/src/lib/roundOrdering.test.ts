import { describe, expect, it } from "vitest";
import { orderRoundsMostRecentFirst } from "./roundOrdering";

describe("orderRoundsMostRecentFirst", () => {
  it("shows the newest round first without changing the source list", () => {
    const rounds = [
      { id: 1, roundNumber: 1 },
      { id: 3, roundNumber: 3 },
      { id: 2, roundNumber: 2 },
    ];

    expect(orderRoundsMostRecentFirst(rounds).map(round => round.roundNumber)).toEqual([3, 2, 1]);
    expect(rounds.map(round => round.roundNumber)).toEqual([1, 3, 2]);
  });
});

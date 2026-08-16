import { describe, expect, it } from "vitest";
import { addLiveCorrectCounts } from "./liveStandings";

describe("classificação em direto", () => {
  it("soma apenas os palpites certos de jogos com resultado confirmado", () => {
    const result = addLiveCorrectCounts(
      [
        { userId: 1, userName: "David", userEmail: "david@example.com", correctCount: 4 },
        { userId: 2, userName: "Carlos", userEmail: "carlos@example.com", correctCount: 5 },
      ],
      [
        { id: 11, result: "1" },
        { id: 12, result: "X" },
        { id: 13, result: null },
      ],
      [
        { userId: 1, matchId: 11, prediction: "1" },
        { userId: 1, matchId: 12, prediction: "2" },
        { userId: 2, matchId: 12, prediction: "X" },
        { userId: 2, matchId: 13, prediction: "1" },
      ],
    );

    expect(result).toEqual([
      { userId: 1, userName: "David", userEmail: "david@example.com", correctCount: 5 },
      { userId: 2, userName: "Carlos", userEmail: "carlos@example.com", correctCount: 6 },
    ]);
  });
});

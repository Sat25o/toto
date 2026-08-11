import { describe, expect, it } from "vitest";
import { sortCumulativeStandings } from "./standingsRanking";

describe("sortCumulativeStandings", () => {
  it("ordena pela soma de acertos, mesmo sem existir vencedor de jornada", () => {
    const standings = sortCumulativeStandings([
      { userId: 1, userName: "David", correctCount: 6 },
      { userId: 2, userName: "Duarte", correctCount: 8 },
    ]);

    expect(standings.map(entry => entry.userName)).toEqual(["Duarte", "David"]);
  });

  it("mantém uma ordem previsível pelo nome em caso de empate", () => {
    const standings = sortCumulativeStandings([
      { userId: 2, userName: "Nuno", correctCount: 4 },
      { userId: 1, userName: "David", correctCount: 4 },
    ]);

    expect(standings.map(entry => entry.userName)).toEqual(["David", "Nuno"]);
  });
});

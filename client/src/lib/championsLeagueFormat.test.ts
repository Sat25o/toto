import { describe, expect, it } from "vitest";
import { CHAMPIONS_LEAGUE_FORMAT, CHAMPIONS_LEAGUE_STAGES, getChampionsPairing } from "./championsLeagueFormat";

describe("formato da Liga dos Campeões", () => {
  it("leva os 16 qualificados até uma final na Jornada 17", () => {
    expect(CHAMPIONS_LEAGUE_STAGES.map(stage => stage.participants)).toEqual([16, 8, 4, 2]);
    expect(CHAMPIONS_LEAGUE_STAGES.at(-1)?.roundNumber).toBe(CHAMPIONS_LEAGUE_FORMAT.finalRound);
  });

  it("cria emparelhamentos equilibrados a partir da classificação", () => {
    expect(getChampionsPairing(1)).toBe("1.º vs 16.º");
    expect(getChampionsPairing(8)).toBe("8.º vs 9.º");
  });
});

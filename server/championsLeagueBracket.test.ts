import { describe, expect, it } from "vitest";
import { buildChampionsLeagueFixtures } from "./championsLeagueBracket";

const qualifiers = Array.from({ length: 16 }, (_, index) => ({ id: index + 100, seed: index + 1 }));

describe("quadro da Liga dos Campeões", () => {
  it("emparelha 1.º contra 16.º e preserva os restantes lugares do ranking", () => {
    const fixtures = buildChampionsLeagueFixtures(qualifiers);
    const roundOf16 = fixtures.filter(fixture => fixture.stage === "round_of_16");

    expect(roundOf16).toHaveLength(8);
    expect(roundOf16[0]).toMatchObject({ homeEntryId: 100, awayEntryId: 115 });
    expect(roundOf16[7]).toMatchObject({ homeEntryId: 107, awayEntryId: 108 });
  });

  it("cria o caminho completo até à final", () => {
    const fixtures = buildChampionsLeagueFixtures(qualifiers);

    expect(fixtures.filter(fixture => fixture.stage === "quarter_final")).toHaveLength(4);
    expect(fixtures.filter(fixture => fixture.stage === "semi_final")).toHaveLength(2);
    expect(fixtures.filter(fixture => fixture.stage === "final")).toHaveLength(1);
  });
});

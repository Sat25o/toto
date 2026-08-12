import { CHAMPIONS_LEAGUE_QUALIFIED_COUNT } from "../shared/league";

export type ChampionsLeagueQualifier = {
  id: number;
  seed: number;
};

export type ChampionsLeagueFixture = {
  stage: "round_of_16" | "quarter_final" | "semi_final" | "final";
  roundNumber: number;
  matchOrder: number;
  homeEntryId: number | null;
  awayEntryId: number | null;
};

export function buildChampionsLeagueFixtures(qualifiers: ChampionsLeagueQualifier[]): ChampionsLeagueFixture[] {
  if (qualifiers.length !== CHAMPIONS_LEAGUE_QUALIFIED_COUNT) {
    throw new Error(`São necessários ${CHAMPIONS_LEAGUE_QUALIFIED_COUNT} qualificados para gerar o quadro`);
  }

  const openingFixtures = Array.from({ length: 8 }, (_, index) => ({
    stage: "round_of_16" as const,
    roundNumber: 14,
    matchOrder: index + 1,
    homeEntryId: qualifiers[index]!.id,
    awayEntryId: qualifiers[CHAMPIONS_LEAGUE_QUALIFIED_COUNT - 1 - index]!.id,
  }));

  const placeholderFixtures = [
    ...Array.from({ length: 4 }, (_, index) => ({ stage: "quarter_final" as const, roundNumber: 15, matchOrder: index + 1 })),
    ...Array.from({ length: 2 }, (_, index) => ({ stage: "semi_final" as const, roundNumber: 16, matchOrder: index + 1 })),
    { stage: "final" as const, roundNumber: 17, matchOrder: 1 },
  ].map(fixture => ({ ...fixture, homeEntryId: null, awayEntryId: null }));

  return [...openingFixtures, ...placeholderFixtures];
}

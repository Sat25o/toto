export type DraftMatch = {
  homeTeam: string;
  awayTeam: string;
};

export const LIGA_BETCLIC_TEAMS = [
  "Académico Viseu",
  "Alverca",
  "Arouca",
  "Benfica",
  "Braga",
  "Casa Pia",
  "Estoril Praia",
  "Estrela da Amadora",
  "FC Porto",
  "Famalicão",
  "Gil Vicente",
  "Marítimo",
  "Moreirense",
  "Nacional",
  "Rio Ave",
  "Santa Clara",
  "Sporting CP",
  "Vitória SC",
] as const;

export const createEmptyMatches = (): DraftMatch[] =>
  Array.from({ length: 7 }, () => ({ homeTeam: "", awayTeam: "" }));

export const updateDraftMatch = (
  matches: DraftMatch[],
  index: number,
  field: keyof DraftMatch,
  value: string,
): DraftMatch[] =>
  matches.map((match, matchIndex) =>
    matchIndex === index ? { ...match, [field]: value } : match,
  );

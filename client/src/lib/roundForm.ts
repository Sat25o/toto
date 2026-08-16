export type DraftMatch = {
  homeTeam: string;
  awayTeam: string;
};

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

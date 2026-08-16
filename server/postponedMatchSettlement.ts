export type SettlementMatch = {
  id: number;
  isPostponed: boolean;
  result: "1" | "X" | "2" | null;
};

export function getValidSettlementMatches(matches: SettlementMatch[]) {
  return matches.filter(match => !match.isPostponed);
}

export function assertRoundCanBeSettled(matches: SettlementMatch[]) {
  const validMatches = getValidSettlementMatches(matches);
  if (validMatches.length === 0) throw new Error("A jornada tem de ter pelo menos um jogo válido");
  if (validMatches.some(match => match.result === null)) {
    throw new Error("Introduza os resultados de todos os jogos válidos antes de calcular o vencedor");
  }
  return validMatches;
}

export function getWinnerIdsForValidMatches(correctByUser: Map<number, number>, validMatchCount: number) {
  return Array.from(correctByUser.entries())
    .filter(([, correct]) => correct === validMatchCount)
    .map(([userId]) => userId);
}

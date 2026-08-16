export type SettlementMatch = {
  id: number;
  isPostponed: boolean;
  isBackup?: boolean;
  result: "1" | "X" | "2" | null;
};

export function getValidSettlementMatches(matches: SettlementMatch[]) {
  const mainMatches = matches.filter(match => !match.isBackup);
  const backupMatch = matches.find(match => match.isBackup);
  const activeMainMatches = mainMatches.filter(match => !match.isPostponed);
  const postponedMainCount = mainMatches.length - activeMainMatches.length;

  if (postponedMainCount === 0) return activeMainMatches;
  if (backupMatch && !backupMatch.isPostponed) return [...activeMainMatches, backupMatch];
  return activeMainMatches;
}

export function assertRoundCanBeSettled(matches: SettlementMatch[]) {
  const validMatches = getValidSettlementMatches(matches);
  if (validMatches.length === 0) {
    throw new Error("A jornada tem de ter pelo menos um jogo válido");
  }
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

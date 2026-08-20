export function orderRoundsMostRecentFirst<T extends { roundNumber: number }>(rounds: T[]) {
  return [...rounds].sort((first, second) => second.roundNumber - first.roundNumber);
}

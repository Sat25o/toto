export const STANDINGS_START_ROUND = 2;

export function isRoundIncludedInStandings(roundNumber: number) {
  return roundNumber >= STANDINGS_START_ROUND;
}

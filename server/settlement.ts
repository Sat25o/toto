/**
 * Returns the informational value due to each winner, rounded to cents.
 * A null value means no monetary amount was supplied for the round.
 */
export function calculateEqualPrizeShare(prizeAmount: number | null, winnerCount: number): number | null {
  if (prizeAmount === null || winnerCount <= 0) return null;
  return Number((prizeAmount / winnerCount).toFixed(2));
}

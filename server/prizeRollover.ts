export function getPrizeCarryOver(input: {
  isSettled: boolean;
  prizeRolledOver: boolean;
  winnerCount: number;
  prizeAmount: number | null;
}) {
  if (!input.isSettled || input.prizeRolledOver || input.winnerCount > 0) return 0;
  return Math.max(0, input.prizeAmount ?? 0);
}

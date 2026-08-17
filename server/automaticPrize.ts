import { BASE_ROUND_PRIZE_AMOUNT } from "@shared/league";
import { getPrizeCarryOver } from "./prizeRollover";

export function calculateAutomaticRoundPrize(previousRound?: {
  isSettled: boolean;
  prizeRolledOver: boolean;
  winnerCount: number;
  prizeAmount: number | null;
}) {
  const carriedPrizeAmount = previousRound
    ? getPrizeCarryOver(previousRound)
    : 0;

  return {
    basePrizeAmount: BASE_ROUND_PRIZE_AMOUNT,
    carriedPrizeAmount,
    totalPrizeAmount: BASE_ROUND_PRIZE_AMOUNT + carriedPrizeAmount,
  };
}

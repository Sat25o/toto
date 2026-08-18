import { BASE_ROUND_PRIZE_AMOUNT } from "@shared/league";
import { getPrizeCarryOver } from "./prizeRollover";

export function calculateAutomaticRoundPrize(previousRound?: {
  isSettled: boolean;
  prizeRolledOver: boolean;
  winnerCount: number;
  prizeAmount: number | null;
}, basePrizeAmount = BASE_ROUND_PRIZE_AMOUNT) {
  const carriedPrizeAmount = previousRound
    ? getPrizeCarryOver(previousRound)
    : 0;

  return {
    basePrizeAmount,
    carriedPrizeAmount,
    totalPrizeAmount: basePrizeAmount + carriedPrizeAmount,
  };
}

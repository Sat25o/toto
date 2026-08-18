import { BASE_ROUND_PRIZE_AMOUNT } from "@shared/league";

export function formatRoundPrize(prizeAmount: string | number | null | undefined) {
  if (prizeAmount === null || prizeAmount === undefined || prizeAmount === "") {
    return null;
  }

  const amount = Number(prizeAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

type RoundPrizeData = {
  prizeAmount?: string | number | null;
  carriedPrizeAmount?: string | number | null;
};

export function getRoundPrizeLabel(round: RoundPrizeData) {
  const recordedPrize = formatRoundPrize(round.prizeAmount);
  if (recordedPrize) {
    return recordedPrize;
  }

  const carriedPrize = Number(round.carriedPrizeAmount ?? 0);
  const recoveredPrize = Number.isFinite(carriedPrize) && carriedPrize >= 0
    ? formatRoundPrize(BASE_ROUND_PRIZE_AMOUNT + carriedPrize)
    : null;

  return recoveredPrize ?? formatRoundPrize(BASE_ROUND_PRIZE_AMOUNT)!;
}

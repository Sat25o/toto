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

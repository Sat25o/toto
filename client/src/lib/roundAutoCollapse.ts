export function shouldAutoCollapseInitiallyOpenRound(input: {
  autoOpenedRoundId: number | null;
  selectedRoundId: number | null;
  predictionCount: number;
  matchCount: number;
}) {
  return (
    input.autoOpenedRoundId !== null &&
    input.autoOpenedRoundId === input.selectedRoundId &&
    input.matchCount > 0 &&
    input.predictionCount >= input.matchCount
  );
}

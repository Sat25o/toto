export type RoundPredictionProgress = {
  predictionCount: number;
  matchCount: number;
};

export function hasSevenConfirmedPredictions(progress: RoundPredictionProgress | undefined): boolean {
  return progress?.matchCount === 7 && progress.predictionCount === 7;
}

export function getMissingPredictionCount(progress: RoundPredictionProgress | undefined): number {
  return Math.max(7 - (progress?.predictionCount ?? 0), 0);
}

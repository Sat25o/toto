export type RoundPredictionProgress = {
  predictionCount: number;
  matchCount: number;
};

export function hasSevenConfirmedPredictions(progress: RoundPredictionProgress | undefined): boolean {
  return progress?.matchCount === 7 && progress.predictionCount === 7;
}

import type { PredictionChoice } from "./predictionSelection";

export function getPredictionProgress(
  savedMatchIds: number[],
  optimisticPredictions: Record<number, PredictionChoice>,
  totalMatches: number,
) {
  const selectedMatchIds = new Set([...savedMatchIds, ...Object.keys(optimisticPredictions).map(Number)]);
  const completed = selectedMatchIds.size;
  return {
    completed,
    total: totalMatches,
    percentage: totalMatches === 0 ? 0 : Math.round((completed / totalMatches) * 100),
  };
}

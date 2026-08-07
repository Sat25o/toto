export type PredictionChoice = "1" | "X" | "2";

export type PredictionSelection = Record<number, PredictionChoice>;

export function selectPrediction(
  selections: PredictionSelection,
  matchId: number,
  prediction: PredictionChoice,
): PredictionSelection {
  return { ...selections, [matchId]: prediction };
}

export function clearSelectedPrediction(
  selections: PredictionSelection,
  matchId: number,
): PredictionSelection {
  const { [matchId]: _removed, ...remaining } = selections;
  return remaining;
}

export type PredictionTone = "correct" | "incorrect" | "missing" | "postponed";

export function getHistoryPredictionTone(prediction: string | undefined, result: string | null, isPostponed = false): PredictionTone {
  if (isPostponed) return "postponed";
  if (!prediction) return "missing";
  if (result === null) return "missing";
  return prediction === result ? "correct" : "incorrect";
}

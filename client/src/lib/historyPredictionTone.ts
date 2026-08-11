export type PredictionTone = "correct" | "incorrect" | "missing";

export function getHistoryPredictionTone(prediction: string | undefined, result: string | null): PredictionTone {
  if (!prediction) return "missing";
  return prediction === result ? "correct" : "incorrect";
}

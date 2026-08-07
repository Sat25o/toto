export type PredictionChoice = "1" | "X" | "2";

export type ProgressMatch = {
  id: number;
  matchOrder: number;
  result: PredictionChoice | null;
};

export type PublicPrediction = {
  matchId: number;
  prediction: PredictionChoice | null;
};

export type ParticipantProgress = {
  status: "eligible" | "eliminated" | "winner";
  correctCount: number;
  evaluatedCount: number;
  failedMatchIds: number[];
};

/**
 * Tracks a participant cumulatively: one wrong (or missing) prediction after an
 * official result eliminates them; only six correct results produces a winner.
 */
export function getParticipantProgress(
  matches: ProgressMatch[],
  predictions: PublicPrediction[],
  throughMatchOrder = Number.POSITIVE_INFINITY,
): ParticipantProgress {
  const predictionByMatch = new Map(predictions.map(item => [item.matchId, item.prediction]));
  const evaluatedMatches = matches.filter(
    match => match.matchOrder <= throughMatchOrder && match.result !== null,
  );
  const failedMatchIds = evaluatedMatches
    .filter(match => predictionByMatch.get(match.id) !== match.result)
    .map(match => match.id);
  const correctCount = evaluatedMatches.length - failedMatchIds.length;
  const allResultsKnown = matches.length === 6 && matches.every(match => match.result !== null);

  if (failedMatchIds.length > 0) {
    return { status: "eliminated", correctCount, evaluatedCount: evaluatedMatches.length, failedMatchIds };
  }

  if (allResultsKnown && evaluatedMatches.length === matches.length) {
    return { status: "winner", correctCount, evaluatedCount: evaluatedMatches.length, failedMatchIds };
  }

  return { status: "eligible", correctCount, evaluatedCount: evaluatedMatches.length, failedMatchIds };
}

export type PredictionChoice = "1" | "X" | "2";

export type ProgressMatch = {
  id: number;
  matchOrder: number;
  result: PredictionChoice | null;
  isPostponed?: boolean;
  isBackup?: boolean;
};

export function getActivePublicMatches(matches: ProgressMatch[]) {
  const mainMatches = matches.filter(match => !match.isBackup);
  const backupMatch = matches.find(match => match.isBackup);
  const activeMainMatches = mainMatches.filter(match => !match.isPostponed);
  const postponedMainCount = mainMatches.length - activeMainMatches.length;
  return postponedMainCount === 1 && backupMatch ? [...activeMainMatches, backupMatch] : activeMainMatches;
}

export type PublicPrediction = {
  matchId: number;
  prediction: PredictionChoice | null;
};

export type ParticipantProgress = {
  status: "eligible" | "eliminated" | "winner";
  correctCount: number;
  evaluatedCount: number;
  failedMatchIds: number[];
  missingMatchIds: number[];
  eliminationReason: "incorrect_prediction" | "incomplete_predictions" | null;
};

/**
 * Tracks a participant cumulatively. After the betting deadline, a participant
 * who has not filled every game is eliminated immediately. Otherwise, one wrong
 * official result eliminates them; only six correct results produces a winner.
 */
export function getParticipantProgress(
  matches: ProgressMatch[],
  predictions: PublicPrediction[],
  throughMatchOrder = Number.POSITIVE_INFINITY,
  eliminateIncompletePredictions = false,
): ParticipantProgress {
  const predictionByMatch = new Map(predictions.map(item => [item.matchId, item.prediction]));
  const validMatches = getActivePublicMatches(matches);
  const missingMatchIds = validMatches
    .filter(match => predictionByMatch.get(match.id) === undefined || predictionByMatch.get(match.id) === null)
    .map(match => match.id);
  const evaluatedMatches = validMatches.filter(
    match => match.matchOrder <= throughMatchOrder && match.result !== null,
  );
  const failedMatchIds = evaluatedMatches
    .filter(match => predictionByMatch.get(match.id) !== match.result)
    .map(match => match.id);
  const correctCount = evaluatedMatches.length - failedMatchIds.length;
  const allResultsKnown = validMatches.length > 0 && validMatches.every(match => match.result !== null);

  if (eliminateIncompletePredictions && missingMatchIds.length > 0) {
    return {
      status: "eliminated",
      correctCount,
      evaluatedCount: evaluatedMatches.length,
      failedMatchIds,
      missingMatchIds,
      eliminationReason: "incomplete_predictions",
    };
  }

  if (failedMatchIds.length > 0) {
    return {
      status: "eliminated",
      correctCount,
      evaluatedCount: evaluatedMatches.length,
      failedMatchIds,
      missingMatchIds,
      eliminationReason: "incorrect_prediction",
    };
  }

  if (allResultsKnown && evaluatedMatches.length === validMatches.length) {
    return {
      status: "winner",
      correctCount,
      evaluatedCount: evaluatedMatches.length,
      failedMatchIds,
      missingMatchIds,
      eliminationReason: null,
    };
  }

  return {
    status: "eligible",
    correctCount,
    evaluatedCount: evaluatedMatches.length,
    failedMatchIds,
    missingMatchIds,
    eliminationReason: null,
  };
}

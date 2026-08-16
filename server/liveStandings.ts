export type LiveStandingBase = {
  userId: number;
  userName: string;
  userEmail: string;
  correctCount: number;
};

export type LiveResultMatch = {
  id: number;
  result: "1" | "X" | "2" | null;
};

export type LivePrediction = {
  userId: number;
  matchId: number;
  prediction: "1" | "X" | "2";
};

/** Adds only confirmed live results to the official totals without persisting the provisional score. */
export function addLiveCorrectCounts(
  standings: LiveStandingBase[],
  completedMatches: LiveResultMatch[],
  roundPredictions: LivePrediction[],
) {
  const completedResultByMatch = new Map(
    completedMatches
      .filter((match): match is LiveResultMatch & { result: "1" | "X" | "2" } => match.result !== null)
      .map(match => [match.id, match.result]),
  );
  const liveCorrectByUser = new Map<number, number>();

  for (const prediction of roundPredictions) {
    const result = completedResultByMatch.get(prediction.matchId);
    if (result && prediction.prediction === result) {
      liveCorrectByUser.set(prediction.userId, (liveCorrectByUser.get(prediction.userId) ?? 0) + 1);
    }
  }

  return standings.map(standing => ({
    ...standing,
    correctCount: standing.correctCount + (liveCorrectByUser.get(standing.userId) ?? 0),
  }));
}

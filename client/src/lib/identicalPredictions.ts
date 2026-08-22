export type PredictionChoice = "1" | "X" | "2";

type MatchLike = {
  id: number;
  matchOrder: number;
  isBackup?: boolean;
  isPostponed?: boolean;
};

type ParticipantLike = {
  id: number;
  name: string;
  predictions: Array<{
    matchId: number;
    prediction: PredictionChoice | null;
  }>;
};

export type IdenticalPredictionGroup = {
  predictions: PredictionChoice[];
  participants: Array<Pick<ParticipantLike, "id" | "name">>;
};

export function getCopycatComparisonMatches<T extends MatchLike>(matches: T[]): T[] {
  const mainMatches = matches.filter(match => !match.isBackup && !match.isPostponed);
  const hasPostponedMainMatch = matches.some(match => !match.isBackup && match.isPostponed);
  const activeBackupMatch = matches.find(match => match.isBackup && !match.isPostponed);
  const matchesThatCount = hasPostponedMainMatch && activeBackupMatch
    ? [...mainMatches, activeBackupMatch]
    : mainMatches;

  return [...matchesThatCount].sort((first, second) => first.matchOrder - second.matchOrder);
}

export function findIdenticalPredictionGroups(
  matches: MatchLike[],
  participants: ParticipantLike[],
): IdenticalPredictionGroup[] {
  const orderedMatches = getCopycatComparisonMatches(matches);
  const groups = new Map<string, IdenticalPredictionGroup>();

  participants.forEach(participant => {
    const predictionsByMatch = new Map(participant.predictions.map(prediction => [prediction.matchId, prediction.prediction]));
    const predictions = orderedMatches.map(match => predictionsByMatch.get(match.id));

    if (predictions.some(prediction => prediction === undefined || prediction === null)) return;

    const completePredictions = predictions as PredictionChoice[];
    const signature = completePredictions.join("|");
    const group = groups.get(signature);

    if (group) {
      group.participants.push({ id: participant.id, name: participant.name });
      return;
    }

    groups.set(signature, {
      predictions: completePredictions,
      participants: [{ id: participant.id, name: participant.name }],
    });
  });

  return Array.from(groups.values())
    .filter(group => group.participants.length > 1)
    .sort((first, second) => second.participants.length - first.participants.length);
}

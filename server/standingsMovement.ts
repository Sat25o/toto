export type StandingScore = {
  userId: number;
  userName: string | null;
  correctCount: number;
};

export type StandingMovement = "up" | "down" | "same";

function sortStandings<T extends StandingScore>(entries: T[]) {
  return [...entries].sort((first, second) => {
    if (second.correctCount !== first.correctCount) return second.correctCount - first.correctCount;
    return (first.userName ?? "").localeCompare(second.userName ?? "", "pt-PT");
  });
}

export function addStandingMovements<T extends StandingScore>(current: T[], previous: StandingScore[] | null) {
  const currentRanked = sortStandings(current);
  const previousPositionByUserId = previous === null
    ? null
    : new Map(sortStandings(previous).map((entry, index) => [entry.userId, index + 1]));

  return currentRanked.map((entry, index) => {
    const position = index + 1;
    const previousPosition = previousPositionByUserId?.get(entry.userId) ?? null;
    const positionChange = previousPosition === null ? 0 : previousPosition - position;
    const movement: StandingMovement = positionChange > 0 ? "up" : positionChange < 0 ? "down" : "same";
    return { ...entry, position, previousPosition, positionChange, movement };
  });
}

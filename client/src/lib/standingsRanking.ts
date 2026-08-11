export type CumulativeStanding = {
  userId: number;
  userName: string | null;
  correctCount: number;
};

export function sortCumulativeStandings<T extends CumulativeStanding>(standings: T[]) {
  return [...standings].sort((first, second) => {
    if (second.correctCount !== first.correctCount) {
      return second.correctCount - first.correctCount;
    }
    return (first.userName ?? "").localeCompare(second.userName ?? "", "pt-PT");
  });
}

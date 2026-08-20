export type DashboardRoundFilter = "all" | "open" | "settled";

export type DashboardRoundStatus = {
  id: number;
  roundNumber: number;
  bettingDeadline: Date | string;
  isSettled: boolean;
};

export function getNextOpenRound<T extends DashboardRoundStatus>(rounds: T[], now: Date) {
  return rounds
    .filter(round => !round.isSettled && new Date(round.bettingDeadline) > now)
    .sort((first, second) => new Date(first.bettingDeadline).getTime() - new Date(second.bettingDeadline).getTime())[0];
}

export function filterDashboardRounds<T extends DashboardRoundStatus>(rounds: T[], filter: DashboardRoundFilter, now: Date) {
  if (filter === "open") return rounds.filter(round => !round.isSettled && new Date(round.bettingDeadline) > now);
  if (filter === "settled") return rounds.filter(round => round.isSettled);
  return rounds;
}

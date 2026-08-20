export type DashboardRoundFilter = "all" | "open" | "settled";

export type DashboardRound = {
  id: number;
  roundNumber: number;
  bettingDeadline: Date | string;
  isSettled: boolean;
};

export function getCurrentDashboardRound<T extends DashboardRound>(rounds: T[], now: Date) {
  return rounds
    .filter(round => !round.isSettled && new Date(round.bettingDeadline) > now)
    .sort((first, second) => {
      const deadlineDifference = new Date(first.bettingDeadline).getTime() - new Date(second.bettingDeadline).getTime();
      return deadlineDifference !== 0 ? deadlineDifference : first.roundNumber - second.roundNumber;
    })[0];
}

export function orderDashboardRounds<T extends DashboardRound>(rounds: T[], currentRoundId?: number) {
  const orderedByRound = [...rounds].sort((first, second) => second.roundNumber - first.roundNumber);
  if (currentRoundId === undefined) return orderedByRound;

  const currentRound = orderedByRound.find(round => round.id === currentRoundId);
  return currentRound ? [currentRound, ...orderedByRound.filter(round => round.id !== currentRoundId)] : orderedByRound;
}

export function filterDashboardRounds<T extends DashboardRound>(rounds: T[], filter: DashboardRoundFilter, now: Date) {
  if (filter === "open") {
    return rounds.filter(round => !round.isSettled && new Date(round.bettingDeadline) > now);
  }
  if (filter === "settled") {
    return rounds.filter(round => round.isSettled);
  }
  return rounds;
}

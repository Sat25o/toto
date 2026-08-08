export type PublicRoundStatus = "eligible" | "eliminated" | "winner";

type SummaryEntry = {
  participant: { name: string };
  progress: { status: PublicRoundStatus };
};

export function summarizePublicRound(entries: SummaryEntry[]) {
  const eligibleCount = entries.filter(entry => entry.progress.status === "eligible").length;
  const eliminatedCount = entries.filter(entry => entry.progress.status === "eliminated").length;
  const winnerNames = entries
    .filter(entry => entry.progress.status === "winner")
    .map(entry => entry.participant.name);

  return { eligibleCount, eliminatedCount, winnerNames, winnerCount: winnerNames.length };
}

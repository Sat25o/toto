export const CHAMPIONS_LEAGUE_FORMAT = {
  qualificationStartRound: 2,
  qualificationEndRound: 13,
  qualifiedParticipants: 16,
  finalRound: 17,
} as const;

export const CHAMPIONS_LEAGUE_STAGES = [
  { roundNumber: 14, title: "Oitavos de final", participants: 16, ties: 8 },
  { roundNumber: 15, title: "Quartos de final", participants: 8, ties: 4 },
  { roundNumber: 16, title: "Meias-finais", participants: 4, ties: 2 },
  { roundNumber: 17, title: "Final", participants: 2, ties: 1 },
] as const;

export function getChampionsPairing(position: number) {
  return `${position}.º vs ${CHAMPIONS_LEAGUE_FORMAT.qualifiedParticipants + 1 - position}.º`;
}

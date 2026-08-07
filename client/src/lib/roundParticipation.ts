export type RoundParticipant = {
  userId: number;
  userName: string;
  userEmail: string;
  predictionCount: number | string;
};

export function splitRoundParticipation(participants: RoundParticipant[], totalMatches: number) {
  const completed = participants.filter(participant => Number(participant.predictionCount) === totalMatches);
  const pending = participants.filter(participant => Number(participant.predictionCount) < totalMatches);
  return { completed, pending };
}

type Participant = { id: number };

/** Mantém a ordem recebida, mas destaca o participante autenticado em primeiro. */
export function putCurrentParticipantFirst<T extends Participant>(participants: T[], currentUserId: number) {
  return [...participants].sort((left, right) => Number(right.id === currentUserId) - Number(left.id === currentUserId));
}

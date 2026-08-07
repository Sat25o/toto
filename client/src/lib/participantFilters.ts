export type PublicParticipantStatus = "eligible" | "eliminated" | "winner";

export function normalizeParticipantText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-PT").trim();
}

export function shouldShowParticipant(name: string, status: PublicParticipantStatus, query: string, filter: "all" | PublicParticipantStatus) {
  const queryMatches = !query.trim() || normalizeParticipantText(name).includes(normalizeParticipantText(query));
  return queryMatches && (filter === "all" || filter === status);
}

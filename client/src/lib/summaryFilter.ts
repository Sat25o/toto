import type { PublicParticipantStatus } from "./participantFilters";

export function toggleSummaryFilter(current: "all" | PublicParticipantStatus, next: PublicParticipantStatus) {
  return current === next ? "all" : next;
}

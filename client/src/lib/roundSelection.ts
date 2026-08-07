/** Returns null when the currently open round is clicked again. */
export function toggleRoundSelection(currentRoundId: number | null, clickedRoundId: number): number | null {
  return currentRoundId === clickedRoundId ? null : clickedRoundId;
}

export function toggleCopycatsDetail(currentGroupKey: string | null, nextGroupKey: string): string | null {
  return currentGroupKey === nextGroupKey ? null : nextGroupKey;
}

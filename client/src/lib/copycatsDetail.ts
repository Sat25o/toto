export function toggleCopycatsDetail(openGroupKeys: readonly string[], groupKey: string): string[] {
  return openGroupKeys.includes(groupKey)
    ? openGroupKeys.filter(key => key !== groupKey)
    : [...openGroupKeys, groupKey];
}

export function openAllCopycatsDetails(groupKeys: readonly string[]): string[] {
  return Array.from(new Set(groupKeys));
}

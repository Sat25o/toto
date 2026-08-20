export function toggleExpandedMessage(expandedMessageIds: number[], messageId: number) {
  return expandedMessageIds.includes(messageId)
    ? expandedMessageIds.filter(id => id !== messageId)
    : [...expandedMessageIds, messageId];
}

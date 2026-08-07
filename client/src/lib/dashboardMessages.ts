export type DashboardMessage = {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  isActive: boolean;
  createdAt: Date | string;
};

export function getDashboardMessages(messages: DashboardMessage[]) {
  return messages
    .filter(message => message.isActive)
    .sort((left, right) => {
      if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}

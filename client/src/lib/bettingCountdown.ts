export type BettingCountdown = {
  isClosed: boolean;
  label: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function getBettingCountdown(deadline: Date | string, now: Date): BettingCountdown {
  const remainingMilliseconds = new Date(deadline).getTime() - now.getTime();
  if (remainingMilliseconds <= 0) {
    return { isClosed: true, label: "Prazo encerrado" };
  }

  const totalSeconds = Math.floor(remainingMilliseconds / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return { isClosed: false, label: `${days}d ${pad(hours)}h ${pad(minutes)}m` };
  }
  return { isClosed: false, label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
}

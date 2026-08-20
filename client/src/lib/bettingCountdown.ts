export type BettingCountdown = {
  isClosed: boolean;
  label: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function getBettingCountdown(deadline: Date | string, now: Date): BettingCountdown {
  const remainingMilliseconds = new Date(deadline).getTime() - now.getTime();
  if (remainingMilliseconds <= 0) {
    return { isClosed: true, label: "Prazo encerrado", days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  const totalSeconds = Math.floor(remainingMilliseconds / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return { isClosed: false, label: `${days}d ${pad(hours)}h ${pad(minutes)}m`, days: pad(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
  }
  return { isClosed: false, label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`, days: "00", hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

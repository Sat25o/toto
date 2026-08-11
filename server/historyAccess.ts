export function assertRoundHistoryIsAvailable(isSettled: boolean) {
  if (!isSettled) {
    throw new Error("O histórico detalhado fica disponível depois de a jornada ser finalizada");
  }
}

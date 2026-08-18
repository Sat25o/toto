export function assertRoundResultsAreEditable(isSettled: boolean, bettingDeadline: Date, now = new Date()) {
  if (isSettled) {
    throw new Error("A jornada já foi fechada; os resultados não podem ser alterados");
  }

  if (now < bettingDeadline) {
    throw new Error("Os resultados só podem ser geridos depois de fechado o prazo de apostas");
  }
}

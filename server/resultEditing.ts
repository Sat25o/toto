export function assertRoundResultsAreEditable(isSettled: boolean) {
  if (isSettled) {
    throw new Error("A jornada já foi fechada; os resultados não podem ser alterados");
  }
}

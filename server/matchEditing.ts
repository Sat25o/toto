export function assertRoundMatchesAreEditable(input: {
  isSettled: boolean;
  bettingDeadline: Date;
  hasPredictions: boolean;
  hasOfficialResults: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  if (input.isSettled) {
    throw new Error("Os jogos não podem ser alterados depois de a jornada ser fechada");
  }
  if (input.bettingDeadline <= now) {
    throw new Error("Os jogos só podem ser alterados antes do prazo de apostas");
  }
  if (input.hasPredictions) {
    throw new Error("Os jogos não podem ser alterados depois de existirem palpites");
  }
  if (input.hasOfficialResults) {
    throw new Error("Os jogos não podem ser alterados depois de introduzir resultados oficiais");
  }
}

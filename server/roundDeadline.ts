export function assertRoundDeadlineCanBeUpdated(isSettled: boolean, deadline: Date, now = new Date()) {
  if (isSettled) throw new Error("Não é possível alterar o prazo de uma jornada já fechada");
  if (deadline <= now) throw new Error("O novo prazo tem de ser futuro");
}

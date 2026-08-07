export type DeletableAccount = {
  id: number;
  email: string;
  isSuperAdmin: boolean;
};

export function assertUserCanBeDeleted(
  target: DeletableAccount,
  actorUserId: number,
  superAdminEmail: string,
) {
  if (target.id === actorUserId) {
    throw new Error("Não pode apagar a sua própria conta");
  }
  if (target.isSuperAdmin || target.email === superAdminEmail) {
    throw new Error("O super administrador não pode ser apagado");
  }
}

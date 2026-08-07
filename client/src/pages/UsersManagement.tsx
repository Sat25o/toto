import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Copy, Edit2, MailPlus, RefreshCw, Shield, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { useEffect, useState } from "react";

type Role = "user" | "admin";

export default function UsersManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; role: Role } | null>(null);
  const [newRole, setNewRole] = useState<Role>("user");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("user");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.users.list.useQuery(
    undefined,
    { enabled: Boolean(user?.role === "admin") },
  );
  const { data: invitations, refetch: refetchInvitations } = trpc.invitations.list.useQuery(
    undefined,
    { enabled: Boolean(user?.isSuperAdmin) },
  );

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Função atualizada.");
      setIsDialogOpen(false);
      void refetchUsers();
    },
    onError: error => toast.error(error.message),
  });
  const deactivateMutation = trpc.users.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Conta desativada.");
      void refetchUsers();
    },
    onError: error => toast.error(error.message),
  });
  const reactivateMutation = trpc.users.reactivate.useMutation({
    onSuccess: () => {
      toast.success("Conta reativada.");
      void refetchUsers();
    },
    onError: error => toast.error(error.message),
  });
  const createInviteMutation = trpc.invitations.create.useMutation({
    onSuccess: data => {
      setLatestInviteUrl(data.inviteUrl);
      setInviteEmail("");
      setInviteRole("user");
      toast.success("Convite criado. Copie e envie o link ao apostador.");
      void refetchInvitations();
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [authLoading, setLocation, user]);

  if (authLoading || !user || user.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">A carregar…</div>;
  }

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      toast.success("Link do convite copiado.");
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione o link e copie-o manualmente.");
    }
  };

  const reissueInvite = (email: string, role: Role) => {
    setInviteEmail(email);
    setInviteRole(role);
    createInviteMutation.mutate({ email, role });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <Users className="h-8 w-8 text-blue-600" /> Gestão de utilizadores
          </h1>
          <p className="text-slate-600">Liga Toto Talho · gestão de apostadores e acessos</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/admin")}>Voltar ao painel</Button>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        {user.isSuperAdmin ? (
          <Card className="border-blue-200 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900"><MailPlus className="h-5 w-5 text-blue-600" /> Convidar apostador</CardTitle>
              <CardDescription>O convite é pessoal, válido durante 7 dias e só pode ser usado uma vez.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email do participante</Label>
                <Input id="invite-email" type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} placeholder="nome@email.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="invite-role">Acesso inicial</Label>
                <Select value={inviteRole} onValueChange={value => setInviteRole(value as Role)}>
                  <SelectTrigger id="invite-role" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Apostador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!inviteEmail || createInviteMutation.isPending}
                onClick={() => createInviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              >
                {createInviteMutation.isPending ? "A criar…" : "Criar convite"}
              </Button>
              {latestInviteUrl && (
                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-900">Link pronto a enviar</p>
                  <p className="break-all text-xs text-blue-800">{latestInviteUrl}</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={copyInvite} title="Copiar link de convite">
                    <Copy className="mr-2 h-4 w-4" /> Copiar link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-900">Registo por convite</CardTitle>
              <CardDescription>A emissão de convites está reservada ao super administrador.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="border-slate-200/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-900">Apostadores registados</CardTitle>
            <CardDescription>{users?.length ?? 0} conta(s) criadas</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Participante</TableHead><TableHead>Acesso</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {users.map(account => {
                      const protectedAccount = account.isSuperAdmin;
                      return (
                        <TableRow key={account.id}>
                          <TableCell>
                            <p className="font-medium text-slate-900">{account.name}</p>
                            <p className="text-xs text-slate-500">{account.email}</p>
                          </TableCell>
                          <TableCell>
                            {protectedAccount ? <Badge className="bg-amber-100 text-amber-800"><ShieldCheck className="mr-1 h-3 w-3" /> Super administrador</Badge> : account.role === "admin" ? <Badge className="bg-purple-100 text-purple-800"><Shield className="mr-1 h-3 w-3" /> Admin</Badge> : <Badge className="bg-blue-100 text-blue-800">Apostador</Badge>}
                          </TableCell>
                          <TableCell>{account.isActive ? <Badge className="bg-emerald-100 text-emerald-800">Ativa</Badge> : <Badge className="bg-slate-200 text-slate-700">Desativada</Badge>}</TableCell>
                          <TableCell className="text-right">
                            {protectedAccount ? (
                              <span title="A conta do super administrador é protegida contra alterações e desativação"><Badge className="bg-amber-50 text-amber-800">Protegida</Badge></span>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Dialog open={isDialogOpen && selectedUser?.id === account.id} onOpenChange={setIsDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" title="Alterar nível de acesso" onClick={() => { setSelectedUser(account); setNewRole(account.role); }}><Edit2 className="h-4 w-4" /></Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Editar acesso</DialogTitle><DialogDescription>Defina o nível de acesso de {account.name}.</DialogDescription></DialogHeader>
                                    <Select value={newRole} onValueChange={value => setNewRole(value as Role)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">Apostador</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent>
                                    </Select>
                                    <Button className="bg-blue-600 hover:bg-blue-700" disabled={updateRoleMutation.isPending} onClick={() => selectedUser && updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole })}>Guardar alteração</Button>
                                  </DialogContent>
                                </Dialog>
                                {account.isActive ? (
                                  <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" title="Desativar conta" onClick={() => deactivateMutation.mutate({ userId: account.id })}><UserX className="h-4 w-4" /></Button>
                                ) : (
                                  <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" title="Reativar conta" onClick={() => reactivateMutation.mutate({ userId: account.id })}><UserCheck className="h-4 w-4" /></Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : <p className="py-8 text-center text-slate-500">Ainda não existem participantes registados.</p>}
          </CardContent>
        </Card>
      </div>

      {user.isSuperAdmin && invitations && invitations.length > 0 && (
        <Card className="mx-auto mt-6 max-w-6xl border-slate-200/70">
          <CardHeader><CardTitle className="text-slate-900">Convites emitidos</CardTitle><CardDescription>Acompanhe os convites pendentes, usados e expirados.</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Acesso</TableHead><TableHead>Estado</TableHead><TableHead>Validade</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>
              {invitations.map(invitation => {
                const expired = !invitation.usedAt && new Date(invitation.expiresAt) < new Date();
                const status = invitation.usedAt ? "Usado" : expired ? "Expirado" : "Pendente";
                return <TableRow key={invitation.id}><TableCell>{invitation.email}</TableCell><TableCell>{invitation.role === "admin" ? "Administrador" : "Apostador"}</TableCell><TableCell><Badge className={status === "Usado" ? "bg-slate-200 text-slate-700" : status === "Expirado" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>{status}</Badge></TableCell><TableCell>{new Date(invitation.expiresAt).toLocaleString("pt-PT")}</TableCell><TableCell className="text-right">{status === "Usado" ? <span className="text-xs text-slate-500">Sem ação</span> : <Button variant="outline" size="sm" className="whitespace-nowrap" disabled={createInviteMutation.isPending} onClick={() => reissueInvite(invitation.email, invitation.role)} title="Criar um novo link válido durante 7 dias"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Reemitir</Button>}</TableCell></TableRow>;
              })}
            </TableBody></Table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

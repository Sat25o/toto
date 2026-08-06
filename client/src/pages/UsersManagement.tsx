import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Shield, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";

export default function UsersManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch } = trpc.users.list.useQuery();

  // Update user role mutation
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role atualizado com sucesso!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar role");
    },
  });

  // Deactivate user mutation
  const deactivateMutation = trpc.users.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Utilizador desativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desativar utilizador");
    },
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user || user.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const handleUpdateRole = () => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };

  const handleDeactivate = (userId: number) => {
    if (confirm("Tem a certeza que deseja desativar este utilizador?")) {
      deactivateMutation.mutate({ userId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              Gestão de Utilizadores
            </h1>
            <p className="text-slate-600">Gerencie os 34 apostadores</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/admin")}
            className="border-slate-300"
          >
            Voltar ao Admin
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-6xl mx-auto">
        <Card className="border-slate-200/50">
          <CardHeader>
            <CardTitle className="text-slate-900">Apostadores Registados</CardTitle>
            <CardDescription>
              Total: {users?.length || 0} utilizadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200">
                      <TableHead className="text-slate-600">Nome</TableHead>
                      <TableHead className="text-slate-600">Email</TableHead>
                      <TableHead className="text-slate-600">Role</TableHead>
                      <TableHead className="text-slate-600">Registado em</TableHead>
                      <TableHead className="text-slate-600">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id} className="border-slate-100 hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-900">{u.name}</TableCell>
                        <TableCell className="text-slate-600">{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {u.role === "admin" ? (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              "Apostador"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {new Date(u.createdAt).toLocaleDateString("pt-PT")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog open={isDialogOpen && selectedUser?.id === u.id} onOpenChange={setIsDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setNewRole(u.role);
                                  }}
                                  className="border-slate-300"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Role</DialogTitle>
                                  <DialogDescription>
                                    Alterar role para {u.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">Novo Role</label>
                                    <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="user">Apostador</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={handleUpdateRole}
                                    disabled={updateRoleMutation.isPending}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                  >
                                    {updateRoleMutation.isPending ? "Atualizando..." : "Atualizar"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(u.id)}
                              disabled={deactivateMutation.isPending}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">Nenhum utilizador registado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

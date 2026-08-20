import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_EMBLEM_URL } from "@/lib/brandAssets";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const invitationToken = new URLSearchParams(window.location.search).get("token") ?? "";
  const invitedEmail = new URLSearchParams(window.location.search).get("email") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success("Conta criada com sucesso!");
      setLocation(data.user.role === "admin" ? "/admin" : "/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registar");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As passwords não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      return;
    }

    registerMutation.mutate({ name, email, password, invitationToken });
  };

  if (!invitationToken || !invitedEmail) {
    return (
      <div className="league-page flex min-h-screen items-center justify-center p-4">
        <Card className="league-panel w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Registo por convite</CardTitle>
            <CardDescription>
              A Liga Toto Talho aceita novos participantes apenas através de um convite válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setLocation("/login")}>
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="league-page flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={SITE_EMBLEM_URL}
            alt="Emblema Liga Toto Talho"
            className="mx-auto mb-4 h-28 w-28 rounded-[1.75rem] border border-red-100 object-cover shadow-xl"
          />
          <p className="league-label">Registo por convite</p>
          <h1 className="text-2xl font-bold text-slate-900">Liga Toto Talho</h1>
          <p className="text-slate-600">Ativa a tua conta para entrar na competição.</p>
        </div>

        {/* Register Card */}
        <Card className="league-panel shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Ativar convite</CardTitle>
            <CardDescription>Defina os seus dados para entrar na Liga Toto Talho</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-700">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="O teu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 border-slate-300"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teu@email.com"
                  value={email}
                  required
                  readOnly
                  className="mt-1 border-slate-300"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700">
                  Palavra-passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 border-slate-300"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-slate-700">
                  Confirmar palavra-passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 border-slate-300"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || registerMutation.isPending}
                className="w-full bg-primary text-primary-foreground shadow-md shadow-red-900/15 hover:bg-primary/90"
              >
                {isLoading || registerMutation.isPending ? "A criar conta..." : "Ativar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setLocation("/login")}
                className="text-sm font-semibold text-primary hover:text-primary/80"
              >
                Já tem conta? Fazer login
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          © 2026 Liga Toto Talho. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

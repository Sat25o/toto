import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Registo realizado com sucesso! Faça login agora.");
      setLocation("/login");
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

    setIsLoading(true);
    registerMutation.mutate({ name, email, password });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Liga Portugal Betclic</h1>
          </div>
          <p className="text-slate-600">Prognósticos 34 Jornadas</p>
        </div>

        {/* Register Card */}
        <Card className="border-slate-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Criar Conta</CardTitle>
            <CardDescription>Registar-se para participar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-700">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu Nome"
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
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 border-slate-300"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700">
                  Password
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
                  Confirmar Password
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading || registerMutation.isPending ? "Carregando..." : "Registar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600 text-sm">
                Já tem conta?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Fazer login aqui
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          © 2026 Liga Portugal Betclic. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

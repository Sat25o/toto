import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Login realizado com sucesso!");
      // Redirect based on role
      if (data.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Liga Toto Talho</h1>
          </div>
          <p className="text-slate-600">Prognósticos 34 Jornadas</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Fazer Login</CardTitle>
            <CardDescription>Entre com seu email e password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button
                type="submit"
                disabled={isLoading || loginMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading || loginMutation.isPending ? "Carregando..." : "Fazer Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600 text-sm">
                Para criar uma conta, peça um convite ao administrador.
              </p>
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

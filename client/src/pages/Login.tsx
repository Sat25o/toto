import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_EMBLEM_URL } from "@/lib/brandAssets";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Login realizado com sucesso!");
      if (data.user.mustChangePassword) {
        setLocation("/dashboard");
        return;
      }
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
    <div className="league-page flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <Card className="league-panel overflow-hidden border-white/80 shadow-2xl shadow-slate-900/10">
          <CardHeader className="items-center text-center">
            <img
              src={SITE_EMBLEM_URL}
              alt="Emblema Liga Toto Talho"
              className="mx-auto mb-3 h-24 w-24 rounded-[1.5rem] border border-red-100 object-cover shadow-xl"
            />
            <p className="league-label">Área privada</p>
            <CardTitle className="text-2xl text-slate-900">Entrar na liga</CardTitle>
            <CardDescription>Acede ao teu boletim e acompanha a jornada.</CardDescription>
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
                  placeholder="teu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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

              <Button
                type="submit"
                disabled={isLoading || loginMutation.isPending}
                className="w-full bg-primary text-primary-foreground shadow-md shadow-red-900/15 hover:bg-primary/90"
              >
                {isLoading || loginMutation.isPending ? "A entrar..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

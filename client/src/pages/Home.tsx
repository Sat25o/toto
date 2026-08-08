import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/InstallAppButton";
import { SamsungInstallGuide } from "@/components/SamsungInstallGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleHelp, Trophy, Users, Target, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-blue-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    if (user.role === "admin") {
      setLocation("/admin");
    } else {
      setLocation("/dashboard");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Liga Toto Talho</h1>
          </div>
          <div className="flex items-center gap-2">
            <InstallAppButton className="hidden sm:inline-flex" />
            <Button variant="outline" size="icon" onClick={() => setLocation("/help")} title="Abrir centro de ajuda"><CircleHelp className="h-4 w-4" /></Button>
            <Button
              onClick={() => startLogin()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
            Prognósticos da <span className="text-blue-600">Liga Portugal</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            
          </p>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
          >
            Começar Agora
          </Button>
          <div className="mt-4 flex flex-col items-center gap-2"><InstallAppButton /><p className="text-xs text-slate-500">Instalação segura pelo navegador — não descarrega ficheiros APK.</p></div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-slate-200/50 hover:border-blue-200 hover:shadow-lg transition-all">
            <CardHeader>
              <Trophy className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-slate-900">34 Jornadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Acompanhe toda a temporada da Liga Portugal com palpites em cada jornada.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/50 hover:border-blue-200 hover:shadow-lg transition-all">
            <CardHeader>
              <Target className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-slate-900">6 Jogos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Escolha entre 1, X ou 2 em cada jogo. Acerte em todos para ganhar o prémio.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/50 hover:border-blue-200 hover:shadow-lg transition-all">
            <CardHeader>
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-slate-900">34 Apostadores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Compete com outros apostadores e suba no ranking geral da temporada.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/50 hover:border-blue-200 hover:shadow-lg transition-all">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-slate-900">Classificação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Acompanhe a sua posição no ranking e veja quem lidera a competição.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border border-slate-200/50 p-8 mb-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Como Funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Faça Login</h4>
              <p className="text-slate-600">
                Aceda à sua conta e veja as jornadas disponíveis para apostar.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Faça Palpites</h4>
              <p className="text-slate-600">
                Escolha 1, X ou 2 para cada um dos 6 jogos antes do prazo limite.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">3</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Ganhe Prémios</h4>
              <p className="text-slate-600">
                Se acertar em todos os 6, você é o vencedor da jornada!
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16"><SamsungInstallGuide /></div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Pronto para começar?</h3>
          <p className="text-blue-100 mb-8 text-lg">
            Junte-se aos 34 melhores apostadores da Liga Toto Talho
          </p>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="bg-white hover:bg-blue-50 text-blue-600 font-semibold px-8 py-6"
          >
            Entrar Agora
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-slate-50/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600">
          <p>© 2026 Liga Toto Talho. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

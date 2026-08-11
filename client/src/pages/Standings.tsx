import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal } from "lucide-react";
import { sortCumulativeStandings } from "@/lib/standingsRanking";

export default function Standings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch standings
  const { data: standings, isLoading } = trpc.standings.list.useQuery();
  const sortedStandings = sortCumulativeStandings(standings ?? []);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-slate-400 font-semibold">{position + 1}º</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Classificação Geral</h1>
            <p className="text-slate-600">Ranking de apostadores por acertos totais</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation(user.role === "admin" ? "/admin" : "/dashboard")}
            className="border-slate-300"
          >
            Voltar
          </Button>
        </div>
      </div>

      {/* Standings Table */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-slate-200/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-slate-200">
            <CardTitle className="text-slate-900">Ranking da Temporada</CardTitle>
            <CardDescription>Total de acertos acumulados em todas as jornadas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sortedStandings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">
                        Posição
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">
                        Apostador
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-600">
                        Acertos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStandings.map((entry, index) => {
                      const isCurrentUser = user?.id === entry.userId;
                      return (
                        <tr
                          key={entry.userId}
                          className={`border-b border-slate-100 transition-all ${
                            isCurrentUser
                              ? "bg-blue-50 hover:bg-blue-100"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {getMedalIcon(index)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {entry.userName || "Utilizador"}
                              {isCurrentUser && (
                                <Badge className="ml-2 bg-blue-100 text-blue-800">Você</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
                              {entry.correctCount}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Nenhum dado de classificação disponível ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-slate-200/50 mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-blue-900 text-sm">
              <span className="font-semibold">Como funciona:</span> O ranking é atualizado automaticamente
              após cada jornada ser finalizada. Os acertos são contados quando você acerta o resultado
              (1, X ou 2) de cada jogo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

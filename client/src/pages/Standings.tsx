import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, Minus, Trophy, Medal, Radio } from "lucide-react";
import { sortCumulativeStandings } from "@/lib/standingsRanking";
import { STANDINGS_START_ROUND } from "@shared/league";

export default function Standings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch standings
  const { data: standings, isLoading } = trpc.standings.list.useQuery();
  const { data: liveStandings, isLoading: isLiveLoading } = trpc.standings.live.useQuery(undefined, {
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
  const sortedStandings = sortCumulativeStandings(standings ?? []);
  const sortedLiveStandings = sortCumulativeStandings(liveStandings?.standings ?? []);
  const hasLiveResults = (liveStandings?.completedMatchCount ?? 0) > 0;

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

  const getMovementIndicator = (entry: (typeof sortedStandings)[number]) => {
    if (entry.movement === "up") {
      return <span className="inline-flex items-center gap-1 font-semibold text-emerald-700" title={`Subiu ${entry.positionChange} posição(ões) desde a jornada anterior`}><ArrowUp className="h-4 w-4" />{entry.positionChange}</span>;
    }
    if (entry.movement === "down") {
      return <span className="inline-flex items-center gap-1 font-semibold text-red-700" title={`Desceu ${Math.abs(entry.positionChange)} posição(ões) desde a jornada anterior`}><ArrowDown className="h-4 w-4" />{Math.abs(entry.positionChange)}</span>;
    }
    return <span className="inline-flex items-center gap-1 text-slate-500" title={entry.previousPosition === null ? "Ainda não existe jornada anterior para comparar" : "Manteve a mesma posição"}><Minus className="h-4 w-4" />{entry.previousPosition === null ? "—" : "0"}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Classificação Geral</h1>
            <p className="text-slate-600">Ranking de apostadores por acertos desde a Jornada {STANDINGS_START_ROUND}</p>
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

      {/* Live standings */}
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 overflow-hidden border-emerald-200">
          <CardHeader className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-slate-900"><Radio className="h-5 w-5 text-emerald-600" /> Classificação em direto</CardTitle>
              <Badge className="bg-emerald-600 text-white">Provisória</Badge>
            </div>
            <CardDescription>
              {hasLiveResults
                ? `${liveStandings?.completedMatchCount} jogo(s) com resultado registado${liveStandings?.liveRoundNumbers?.length ? ` · Jornada${liveStandings.liveRoundNumbers.length > 1 ? "s" : ""} ${liveStandings.liveRoundNumbers.join(", ")}` : ""}`
                : "Aguarda os primeiros resultados das jornadas em curso. Atualiza automaticamente a cada 10 segundos."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLiveLoading ? (
              <div className="space-y-2 p-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : hasLiveResults ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-emerald-100 bg-emerald-50/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Posição</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Apostador</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Variação</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-600">Acertos</th>
                  </tr></thead>
                  <tbody>{sortedLiveStandings.map((entry, index) => {
                    const isCurrentUser = user?.id === entry.userId;
                    return <tr key={entry.userId} className={`border-b border-emerald-50 ${isCurrentUser ? "bg-blue-50" : "hover:bg-emerald-50/50"}`}>
                      <td className="px-6 py-4"><div className="flex items-center gap-3">{getMedalIcon(index)}</div></td>
                      <td className="px-6 py-4"><div className="font-semibold text-slate-900">{entry.userName || "Utilizador"}{isCurrentUser && <Badge className="ml-2 bg-blue-100 text-blue-800">Você</Badge>}</div></td>
                      <td className="px-4 py-4 text-center">{getMovementIndicator(entry)}</td>
                      <td className="px-6 py-4 text-right"><div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">{entry.correctCount}</div></td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            ) : <div className="p-6 text-center text-sm text-slate-600">Quando o primeiro resultado for registado, o ranking provisório aparece aqui.</div>}
          </CardContent>
        </Card>

        {/* Official standings table */}
        <Card className="border-slate-200/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-slate-200">
            <CardTitle className="text-slate-900">Classificação oficial</CardTitle>
            <CardDescription>Total de acertos confirmados desde a Jornada {STANDINGS_START_ROUND}</CardDescription>
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
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">
                        Movimento
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
                          <td className="px-4 py-4 text-center">
                            {getMovementIndicator(entry)}
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
              <span className="font-semibold">Como funciona:</span> A classificação começa na Jornada {STANDINGS_START_ROUND}.
              A área em direto soma os resultados já registados, mas só a classificação oficial é confirmada no fecho da jornada. As setas comparam a posição com o ranking oficial antes da jornada em curso. Os acertos da Jornada 1 ficam apenas no Histórico.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

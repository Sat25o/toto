import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { useState } from "react";

export default function RoundHistory() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  // Fetch rounds
  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();

  // Fetch round with matches
  const { data: roundData, isLoading: roundDataLoading } = trpc.rounds.getWithMatches.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );

  // Fetch all predictions for the round (admin only)
  const { data: allPredictions } = trpc.predictions.getByRoundAdmin.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null && user?.role === "admin" }
  );

  // Fetch user's predictions for the round
  const { data: userPredictions } = trpc.predictions.getByRound.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const completedRounds = rounds?.filter(r => r.isSettled) || [];

  const getPredictionStatus = (prediction: string | undefined, result: string | null) => {
    if (!result) return "pending";
    if (!prediction) return "missing";
    return prediction === result ? "correct" : "incorrect";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "correct":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "incorrect":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "missing":
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "correct":
        return "bg-green-50 border-green-200";
      case "incorrect":
        return "bg-red-50 border-red-200";
      case "missing":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Histórico de Jornadas</h1>
            <p className="text-slate-600">Análise detalhada de palpites e resultados</p>
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Rounds Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200/50 sticky top-4">
            <CardHeader>
              <CardTitle className="text-slate-900">Jornadas Finalizadas</CardTitle>
              <CardDescription>Selecione para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {roundsLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : completedRounds.length > 0 ? (
                completedRounds.map((round) => (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedRoundId === round.id
                        ? "bg-blue-50 border-blue-300 text-blue-900"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="font-semibold">Jornada {round.roundNumber}</div>
                    <div className="text-sm text-slate-600">
                      {new Date(round.bettingDeadline).toLocaleDateString("pt-PT")}
                    </div>
                    {round.isSettled && (
                      <Badge className="mt-2 bg-yellow-100 text-yellow-800 text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        Finalizada
                      </Badge>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Nenhuma jornada finalizada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="lg:col-span-3">
          {selectedRoundId === null ? (
            <Card className="border-slate-200/50">
              <CardContent className="pt-12 pb-12 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Selecione uma jornada para ver os detalhes</p>
              </CardContent>
            </Card>
          ) : roundDataLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : roundData ? (
            <div className="space-y-4">
              {/* Round Info */}
              <Card className="border-slate-200/50 bg-gradient-to-r from-blue-50 to-blue-100/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-900">Jornada {roundData.round.roundNumber}</CardTitle>
                      {roundData.round.prize && (
                        <CardDescription className="text-blue-700 font-semibold mt-1">
                          Prémio: {roundData.round.prize}
                        </CardDescription>
                      )}
                    </div>
                    {roundData.round.isSettled && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Trophy className="w-4 h-4 mr-1" />
                        Finalizada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {roundData.round.isSettled && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-4">
                    {roundData.winners.length > 0 ? (
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 font-semibold text-yellow-900"><Trophy className="h-4 w-4" /> Vencedores: {roundData.winners.map(winner => winner.userName).join(", ")}</p>
                        <p className="text-sm text-yellow-800">{roundData.winners.length} participante(s) acertaram os seis jogos.</p>
                        {roundData.winners[0]?.prizeShare && <p className="text-sm font-semibold text-yellow-900">Parte do prémio por vencedor: €{Number(roundData.winners[0].prizeShare).toFixed(2)}</p>}
                      </div>
                    ) : (
                      <p className="font-semibold text-yellow-900">Não houve vencedores nesta jornada.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Matches */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Resultados dos Jogos</h3>
                {roundData.matches.map((match) => (
                  <Card key={match.id} className="border-slate-200/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {match.homeTeam} vs {match.awayTeam}
                          </p>
                          <p className="text-sm text-slate-600">Jogo {match.matchOrder}</p>
                        </div>
                        {match.result && (
                          <Badge className="bg-blue-100 text-blue-800 text-lg font-bold px-3 py-1">
                            {match.result}
                          </Badge>
                        )}
                      </div>

                      {/* User's Prediction */}
                      {userPredictions && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-sm text-slate-600 mb-2">Seu palpite:</p>
                          {userPredictions && userPredictions.length > 0 ? (
                            (() => {
                              const userPred = userPredictions.find(
                                (p) => p.match.id === match.id
                              );
                              const status = getPredictionStatus(
                                userPred?.prediction.prediction,
                                match.result
                              );
                              return (
                                <div className={`flex items-center gap-2 p-2 rounded border ${getStatusColor(status)}`}>
                                  {getStatusIcon(status)}
                                  <span className="font-semibold">
                                    {userPred?.prediction.prediction || "—"}
                                  </span>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-slate-500 text-sm">Sem palpite</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Admin View: All Predictions */}
              {user.role === "admin" && allPredictions && allPredictions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Palpites de Todos os Apostadores</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Jogo</th>
                          {Array.from(new Set(allPredictions.map(p => p.prediction.userId))).map(
                            (userId) => (
                              <th
                                key={userId}
                                className="px-2 py-3 text-center font-semibold text-slate-600 text-xs"
                              >
                                U{userId}
                              </th>
                            )
                          )}
                          <th className="px-4 py-3 text-center font-semibold text-slate-600">Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundData.matches.map((match) => (
                          <tr key={match.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900 font-medium">
                              {match.homeTeam} vs {match.awayTeam}
                            </td>
                            {Array.from(new Set(allPredictions.map(p => p.prediction.userId))).map(
                              (userId) => {
                                const pred = allPredictions.find(
                                  (p) =>
                                    p.prediction.userId === userId &&
                                    p.match.id === match.id
                                );
                                const status = getPredictionStatus(
                                  pred?.prediction.prediction,
                                  match.result
                                );
                                return (
                                  <td
                                    key={userId}
                                    className={`px-2 py-3 text-center border ${getStatusColor(status)}`}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {getStatusIcon(status)}
                                      <span className="font-semibold">
                                        {pred?.prediction.prediction || "—"}
                                      </span>
                                    </div>
                                  </td>
                                );
                              }
                            )}
                            <td className="px-4 py-3 text-center font-bold text-blue-600">
                              {match.result || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, Trophy, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { clearSelectedPrediction, selectPrediction, type PredictionChoice } from "@/lib/predictionSelection";
import { toggleRoundSelection } from "@/lib/roundSelection";
import { getPredictionProgress } from "@/lib/predictionProgress";

export default function BettorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [optimisticPredictions, setOptimisticPredictions] = useState<Record<number, PredictionChoice>>({});
  const [pendingMatchId, setPendingMatchId] = useState<number | null>(null);

  // Fetch rounds
  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();
  
  // Fetch current round with matches
  const { data: roundData, isLoading: roundDataLoading } = trpc.rounds.getWithMatches.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );

  // Fetch user's predictions for the selected round
  const { data: predictions } = trpc.predictions.getByRound.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );

  // Submit prediction mutation
  const submitPredictionMutation = trpc.predictions.submit.useMutation({
    onSuccess: () => {
      toast.success("Palpite registado com sucesso!");
      if (selectedRoundId !== null) {
        void utils.predictions.getByRound.invalidate({ roundId: selectedRoundId });
      }
    },
    onError: (error, variables) => {
      setOptimisticPredictions(current => clearSelectedPrediction(current, variables.matchId));
      toast.error(error.message || "Erro ao registar palpite");
    },
    onSettled: () => setPendingMatchId(null),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, setLocation, user]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  const handleRoundSelection = (roundId: number) => {
    const nextRoundId = toggleRoundSelection(selectedRoundId, roundId);
    // Reset synchronously while changing or closing a round, never after a prediction click.
    setOptimisticPredictions({});
    setPendingMatchId(null);
    setSelectedRoundId(nextRoundId);
  };

  const handlePredictionSubmit = (matchId: number, prediction: "1" | "X" | "2") => {
    if (isDeadlinePassed) return;
    setOptimisticPredictions(current => selectPrediction(current, matchId, prediction));
    setPendingMatchId(matchId);
    submitPredictionMutation.mutate({ matchId, prediction });
  };

  const isDeadlinePassed = roundData?.round && new Date() > new Date(roundData.round.bettingDeadline);
  const formatDeadline = (deadline: Date | string) =>
    new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeStyle: "short" }).format(new Date(deadline));
  const predictionProgress = getPredictionProgress(
    predictions?.map(entry => entry.match.id) ?? [],
    optimisticPredictions,
    roundData?.matches.length ?? 6,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Bem-vindo, {user.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.role === "admin" && (
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                className="border-slate-300"
                title="Voltar ao painel de gestão da competição"
              >
                Administração
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setLocation("/history")}
              className="border-slate-300"
            >
              Histórico
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/public-predictions")}
              className="border-slate-300"
              title="Consultar as apostas de todos os participantes após o fecho do prazo"
            >
              Apostas Públicas
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/standings")}
              className="border-slate-300"
            >
              Classificação
            </Button>
          </div>
        </div>
      </div>

      {/* Rounds List */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rounds Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200/50 sticky top-4">
            <CardHeader>
              <CardTitle className="text-slate-900">Jornadas</CardTitle>
              <CardDescription>Selecione uma jornada para apostar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {roundsLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : rounds && rounds.length > 0 ? (
                rounds.map((round) => (
                  <button
                    key={round.id}
                    onClick={() => handleRoundSelection(round.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedRoundId === round.id
                        ? "bg-blue-50 border-blue-300 text-blue-900"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="font-semibold">Jornada {round.roundNumber}</div>
                    <div className="text-sm text-slate-600">
                      Limite: {formatDeadline(round.bettingDeadline)}
                    </div>
                    {round.isSettled && (
                      <Badge className="mt-2 bg-green-100 text-green-800">Finalizada</Badge>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Nenhuma jornada disponível</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Matches & Predictions */}
        <div className="lg:col-span-2">
          {selectedRoundId === null ? (
            <Card className="border-slate-200/50">
              <CardContent className="pt-12 pb-12 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Selecione uma jornada para começar</p>
              </CardContent>
            </Card>
          ) : roundDataLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
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
                    {isDeadlinePassed ? (
                      <Badge className="bg-red-100 text-red-800">Prazo Encerrado</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Aberto</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    Limite de aposta: {formatDeadline(roundData.round.bettingDeadline)}
                  </div>
                  <div className="mt-4 rounded-lg border border-blue-100 bg-white/70 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Os meus palpites</p>
                      <Badge className={predictionProgress.completed === predictionProgress.total ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                        {predictionProgress.completed}/{predictionProgress.total}
                      </Badge>
                    </div>
                    <Progress value={predictionProgress.percentage} className="h-2" />
                    <p className="mt-2 text-xs text-slate-600">
                      {predictionProgress.completed === predictionProgress.total ? "Palpites completos." : `Faltam ${predictionProgress.total - predictionProgress.completed} palpite(s) para concluir a jornada.`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Deadline Warning */}
              {isDeadlinePassed && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800">O prazo para apostas nesta jornada já passou.</p>
                  </CardContent>
                </Card>
              )}

              {/* Matches */}
              <div className="space-y-3">
                {roundData.matches.map((match) => {
                  const savedPrediction = predictions?.find(
                    (p) => p.match.id === match.id
                  )?.prediction.prediction;
                  const userPrediction = optimisticPredictions[match.id] ?? savedPrediction;

                  return (
                    <Card key={match.id} className="border-slate-200/50 hover:border-blue-200 transition-all">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-500">
                                Jogo {match.matchOrder}
                              </span>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">
                                  {match.homeTeam} vs {match.awayTeam}
                                </p>
                              </div>
                            </div>
                          </div>
                          {match.result && (
                            <Badge className="bg-blue-100 text-blue-800 ml-2">
                              Resultado: {match.result}
                            </Badge>
                          )}
                        </div>

                        {/* Prediction Buttons */}
                        {!isDeadlinePassed && !match.result ? (
                          <div className="flex gap-2">
                            {["1", "X", "2"].map((pred) => (
                              <button
                                key={pred}
                                onClick={() => handlePredictionSubmit(match.id, pred as "1" | "X" | "2")}
                                disabled={pendingMatchId === match.id}
                                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                                  userPrediction === pred
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {pred}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-slate-100 rounded-lg p-3 text-center">
                            <p className="text-slate-600 text-sm">
                              Seu palpite: <span className="font-bold text-slate-900">{userPrediction || "—"}</span>
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

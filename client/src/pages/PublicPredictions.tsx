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

export default function PublicPredictions() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  // Fetch rounds
  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();

  // Fetch public predictions for the round
  const { data: predictions, isLoading: predictionsLoading } = trpc.predictions.getPublic.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  // Filter rounds where deadline has passed
  const closedRounds = rounds?.filter(r => new Date(r.bettingDeadline) < new Date()) || [];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Apostas Públicas</h1>
            <p className="text-slate-600">Veja as apostas de todos os participantes após o prazo fechar</p>
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
              <CardTitle className="text-slate-900">Jornadas Fechadas</CardTitle>
              <CardDescription>Selecione para ver apostas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {roundsLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : closedRounds.length > 0 ? (
                closedRounds.map((round) => (
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
                  </button>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Nenhuma jornada fechada</p>
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
                <p className="text-slate-600">Selecione uma jornada para ver as apostas públicas</p>
              </CardContent>
            </Card>
          ) : predictionsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div className="space-y-4">
              {/* Predictions Table */}
              <Card className="border-slate-200/50">
                <CardHeader>
                  <CardTitle className="text-slate-900">Todas as Apostas</CardTitle>
                  <CardDescription>Comparação de palpites de todos os apostadores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Jogo</th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-600">Resultado</th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-600">Apostas (1/X/2)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.map((pred: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900 font-medium">
                              {pred.match.homeTeam} vs {pred.match.awayTeam}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {pred.match.result ? (
                                <Badge className="bg-blue-100 text-blue-800 text-lg font-bold">
                                  {pred.match.result}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {getStatusIcon(getPredictionStatus(pred.prediction.prediction, pred.match.result))}
                                <span className="font-semibold">{pred.prediction.prediction}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Settings } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  // Fetch rounds
  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();

  // Fetch current round with matches
  const { data: roundData, isLoading: roundDataLoading } = trpc.rounds.getWithMatches.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );

  // Form states
  const [newRoundForm, setNewRoundForm] = useState({
    roundNumber: "",
    prize: "",
    deadline: "",
    matches: Array(6).fill({ homeTeam: "", awayTeam: "" }),
  });

  const [resultForm, setResultForm] = useState<Record<number, "1" | "X" | "2">>({});

  // Create round mutation
  const createRoundMutation = trpc.rounds.create.useMutation({
    onSuccess: () => {
      toast.success("Jornada criada com sucesso!");
      setNewRoundForm({
        roundNumber: "",
        prize: "",
        deadline: "",
        matches: Array(6).fill({ homeTeam: "", awayTeam: "" }),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar jornada");
    },
  });

  // Update result mutation
  const updateResultMutation = trpc.matches.updateResult.useMutation({
    onSuccess: () => {
      toast.success("Resultado atualizado!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar resultado");
    },
  });

  // Calculate winner mutation
  const calculateWinnerMutation = trpc.winner.calculate.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.winnerId
          ? `Vencedor identificado! (ID: ${data.winnerId})`
          : "Nenhum vencedor nesta jornada"
      );
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao calcular vencedor");
    },
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roundNumber = parseInt(newRoundForm.roundNumber);
      const deadline = new Date(newRoundForm.deadline);

      if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 34) {
        toast.error("Número da jornada deve estar entre 1 e 34");
        return;
      }

      if (deadline <= new Date()) {
        toast.error("Prazo deve ser no futuro");
        return;
      }

      const matches = newRoundForm.matches.map((m, i) => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchOrder: i + 1,
      }));

      if (matches.some(m => !m.homeTeam || !m.awayTeam)) {
        toast.error("Todos os jogos devem ter equipa da casa e visitante");
        return;
      }

      createRoundMutation.mutate({
        roundNumber,
        prize: newRoundForm.prize || undefined,
        bettingDeadline: deadline,
        matches,
      });
    } catch (error) {
      toast.error("Erro ao processar formulário");
    }
  };

  const handleUpdateResult = (matchId: number, result: "1" | "X" | "2") => {
    updateResultMutation.mutate({ matchId, result });
    setResultForm(prev => ({ ...prev, [matchId]: result }));
  };

  const handleCalculateWinner = () => {
    if (!selectedRoundId) return;
    calculateWinnerMutation.mutate({ roundId: selectedRoundId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Painel de Administração</h1>
            <p className="text-slate-600">Gerencie jornadas, resultados e vencedores</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/history")}
              className="border-slate-300"
            >
              Histórico
            </Button>
            <Settings className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200">
            <TabsTrigger value="create">Criar Jornada</TabsTrigger>
            <TabsTrigger value="manage">Gerir Resultados</TabsTrigger>
          </TabsList>

          {/* Create Round Tab */}
          <TabsContent value="create" className="mt-6">
            <Card className="border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-slate-900">Criar Nova Jornada</CardTitle>
                <CardDescription>Defina os jogos, prémio e prazo de apostas</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRound} className="space-y-6">
                  {/* Round Number and Prize */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="roundNumber" className="text-slate-700">
                        Número da Jornada (1-34)
                      </Label>
                      <Input
                        id="roundNumber"
                        type="number"
                        min="1"
                        max="34"
                        value={newRoundForm.roundNumber}
                        onChange={(e) =>
                          setNewRoundForm({ ...newRoundForm, roundNumber: e.target.value })
                        }
                        className="mt-1 border-slate-300"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="prize" className="text-slate-700">
                        Prémio (Informativo)
                      </Label>
                      <Input
                        id="prize"
                        type="text"
                        placeholder="ex: €100 em vouchers"
                        value={newRoundForm.prize}
                        onChange={(e) =>
                          setNewRoundForm({ ...newRoundForm, prize: e.target.value })
                        }
                        className="mt-1 border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <Label htmlFor="deadline" className="text-slate-700">
                      Prazo de Apostas
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={newRoundForm.deadline}
                      onChange={(e) =>
                        setNewRoundForm({ ...newRoundForm, deadline: e.target.value })
                      }
                      className="mt-1 border-slate-300"
                      required
                    />
                  </div>

                  {/* Matches */}
                  <div className="space-y-4">
                    <Label className="text-slate-700 font-semibold">6 Jogos</Label>
                    {newRoundForm.matches.map((match, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <Label className="text-sm text-slate-600">Jogo {i + 1} - Casa</Label>
                          <Input
                            type="text"
                            placeholder="ex: Benfica"
                            value={match.homeTeam}
                            onChange={(e) => {
                              const newMatches = [...newRoundForm.matches];
                              newMatches[i].homeTeam = e.target.value;
                              setNewRoundForm({ ...newRoundForm, matches: newMatches });
                            }}
                            className="mt-1 border-slate-300"
                            required
                          />
                        </div>
                        <div className="flex items-end justify-center">
                          <span className="text-slate-600 font-semibold">vs</span>
                        </div>
                        <div>
                          <Label className="text-sm text-slate-600">Visitante</Label>
                          <Input
                            type="text"
                            placeholder="ex: Porto"
                            value={match.awayTeam}
                            onChange={(e) => {
                              const newMatches = [...newRoundForm.matches];
                              newMatches[i].awayTeam = e.target.value;
                              setNewRoundForm({ ...newRoundForm, matches: newMatches });
                            }}
                            className="mt-1 border-slate-300"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={createRoundMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Jornada
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Results Tab */}
          <TabsContent value="manage" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Rounds List */}
              <div className="lg:col-span-1">
                <Card className="border-slate-200/50 sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Jornadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {roundsLoading ? (
                      <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : rounds && rounds.length > 0 ? (
                      rounds.map((round) => (
                        <button
                          key={round.id}
                          onClick={() => setSelectedRoundId(round.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedRoundId === round.id
                              ? "bg-blue-50 border-blue-300"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-semibold text-slate-900">Jornada {round.roundNumber}</div>
                          {round.winnerId && (
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              ✓ Finalizada
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">Nenhuma jornada criada</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results Form */}
              <div className="lg:col-span-2">
                {selectedRoundId === null ? (
                  <Card className="border-slate-200/50">
                    <CardContent className="pt-12 pb-12 text-center">
                      <p className="text-slate-600">Selecione uma jornada para gerir resultados</p>
                    </CardContent>
                  </Card>
                ) : roundDataLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : roundData ? (
                  <div className="space-y-4">
                    <Card className="border-slate-200/50 bg-gradient-to-r from-blue-50 to-blue-100/50">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Jornada {roundData.round.roundNumber}</CardTitle>
                      </CardHeader>
                    </Card>

                    {/* Matches Results */}
                    <div className="space-y-3">
                      {roundData.matches.map((match) => (
                        <Card key={match.id} className="border-slate-200/50">
                          <CardContent className="pt-4">
                            <div className="mb-4">
                              <p className="font-semibold text-slate-900">
                                {match.homeTeam} vs {match.awayTeam}
                              </p>
                              <p className="text-sm text-slate-600">Jogo {match.matchOrder}</p>
                            </div>

                            {match.result ? (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-green-800 font-semibold">
                                  Resultado: <span className="text-lg">{match.result}</span>
                                </p>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                {["1", "X", "2"].map((result) => (
                                  <button
                                    key={result}
                                    onClick={() => handleUpdateResult(match.id, result as "1" | "X" | "2")}
                                    disabled={updateResultMutation.isPending}
                                    className="flex-1 py-2 px-4 rounded-lg font-semibold border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all"
                                  >
                                    {result}
                                  </button>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Calculate Winner Button */}
                    {roundData.matches.every(m => m.result) && !roundData.round.winnerId && (
                      <Button
                        onClick={handleCalculateWinner}
                        disabled={calculateWinnerMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Calcular Vencedor
                      </Button>
                    )}

                    {roundData.round.winnerId && (
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                          <p className="text-green-800 font-semibold">
                            ✓ Vencedor identificado (ID: {roundData.round.winnerId})
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

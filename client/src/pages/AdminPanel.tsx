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
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { createEmptyMatches, updateDraftMatch } from "@/lib/roundForm";
import { toggleRoundSelection } from "@/lib/roundSelection";
import { splitRoundParticipation } from "@/lib/roundParticipation";

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  // Fetch rounds
  const { data: rounds, isLoading: roundsLoading } = trpc.rounds.list.useQuery();

  // Fetch current round with matches
  const { data: roundData, isLoading: roundDataLoading, refetch: refetchRoundData } = trpc.rounds.getWithMatches.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null }
  );
  const { data: participation } = trpc.rounds.getParticipation.useQuery(
    { roundId: selectedRoundId || 0 },
    { enabled: selectedRoundId !== null },
  );

  // Form states
  const [newRoundForm, setNewRoundForm] = useState({
    roundNumber: "",
    prize: "",
    prizeAmount: "",
    deadline: "",
    matches: createEmptyMatches(),
  });

  const [resultForm, setResultForm] = useState<Record<number, "1" | "X" | "2">>({});
  const [deadlineDraft, setDeadlineDraft] = useState("");

  // Create round mutation
  const createRoundMutation = trpc.rounds.create.useMutation({
    onSuccess: () => {
      toast.success("Jornada criada com sucesso!");
      setNewRoundForm({
        roundNumber: "",
        prize: "",
        prizeAmount: "",
        deadline: "",
        matches: createEmptyMatches(),
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
      void refetchRoundData();
    },
    onError: (error) => {
      setResultForm({});
      toast.error(error.message || "Erro ao atualizar resultado");
    },
  });

  const updateDeadlineMutation = trpc.rounds.updateDeadline.useMutation({
    onSuccess: () => {
      toast.success("Data e hora limite atualizadas.");
      void refetchRoundData();
      void utils.rounds.list.invalidate();
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o prazo"),
  });

  // Calculate winner mutation
  const calculateWinnerMutation = trpc.winner.calculate.useMutation({
    onSuccess: (data) => {
      if (data.winnerCount === 0) {
        toast.success("Jornada fechada sem vencedores com seis acertos.");
      } else {
        const shareMessage = data.prizeShare === null ? "" : ` €${data.prizeShare.toFixed(2)} para cada vencedor.`;
        toast.success(`${data.winnerCount} vencedor(es) identificado(s).${shareMessage}`);
      }
      void refetchRoundData();
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
      const prizeAmount = newRoundForm.prizeAmount === "" ? undefined : Number(newRoundForm.prizeAmount);

      if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 34) {
        toast.error("Número da jornada deve estar entre 1 e 34");
        return;
      }

      if (deadline <= new Date()) {
        toast.error("Prazo deve ser no futuro");
        return;
      }

      if (prizeAmount !== undefined && (!Number.isFinite(prizeAmount) || prizeAmount < 0)) {
        toast.error("O valor do prémio deve ser um número positivo ou zero");
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
        prizeAmount,
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

  useEffect(() => {
    if (!roundData?.round) return;
    const deadline = new Date(roundData.round.bettingDeadline);
    const localDeadline = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    setDeadlineDraft(localDeadline);
  }, [roundData?.round?.bettingDeadline, selectedRoundId]);

  const handleDeadlineUpdate = () => {
    if (!selectedRoundId || !deadlineDraft) return;
    const nextDeadline = new Date(deadlineDraft);
    if (Number.isNaN(nextDeadline.getTime()) || nextDeadline <= new Date()) {
      toast.error("Indique uma data e hora futuras.");
      return;
    }
    updateDeadlineMutation.mutate({ roundId: selectedRoundId, bettingDeadline: nextDeadline });
  };

  const totalMatches = roundData?.matches.length ?? 6;
  const { completed: completedParticipants, pending: pendingParticipants } = splitRoundParticipation(participation ?? [], totalMatches);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Painel de Administração</h1>
            <p className="text-sm text-slate-600 sm:text-base">Gerencie jornadas, resultados e vencedores</p>
          </div>
          <nav aria-label="Ações de administração" className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Submeter os seus próprios palpites como participante"
            >
              Os meus palpites
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/users")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Gerir apostadores, estados de conta e convites"
            >
              Utilizadores
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/public-predictions")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Consultar as apostas publicadas depois do fim do prazo"
            >
              Apostas públicas
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/history")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
            >
              Histórico
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/league-management")}
              className="h-11 w-full justify-center whitespace-normal border-slate-300 px-3 text-xs sm:h-10 sm:w-auto sm:text-sm"
              title="Editar regras e publicar avisos no Dashboard"
            >
              Regras e avisos
            </Button>
          </nav>
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
                      <Label htmlFor="prizeAmount" className="text-slate-700">
                        Valor do Prémio (€)
                      </Label>
                      <Input
                        id="prizeAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="ex: 100"
                        value={newRoundForm.prizeAmount}
                        onChange={(e) =>
                          setNewRoundForm({ ...newRoundForm, prizeAmount: e.target.value })
                        }
                        className="mt-1 border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="prize" className="text-slate-700">
                      Descrição do Prémio (opcional)
                    </Label>
                    <Input
                      id="prize"
                      type="text"
                      placeholder="ex: voucher de restaurante"
                      value={newRoundForm.prize}
                      onChange={(e) => setNewRoundForm({ ...newRoundForm, prize: e.target.value })}
                      className="mt-1 border-slate-300"
                    />
                    <p className="mt-1 text-xs text-slate-500">Se houver vários vencedores, o valor indicado é dividido igualmente.</p>
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
                            onChange={(e) =>
                              setNewRoundForm(current => ({
                                ...current,
                                matches: updateDraftMatch(current.matches, i, "homeTeam", e.target.value),
                              }))
                            }
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
                            onChange={(e) =>
                              setNewRoundForm(current => ({
                                ...current,
                                matches: updateDraftMatch(current.matches, i, "awayTeam", e.target.value),
                              }))
                            }
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
                          onClick={() => setSelectedRoundId(currentRoundId => toggleRoundSelection(currentRoundId, round.id))}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedRoundId === round.id
                              ? "bg-blue-50 border-blue-300"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-semibold text-slate-900">Jornada {round.roundNumber}</div>
                          {round.isSettled && (
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

                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-base text-slate-900">Data e hora limite das apostas</CardTitle>
                        <CardDescription>Altere o prazo enquanto a jornada estiver aberta. Os palpites passam a respeitar o novo limite imediatamente.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="w-full flex-1">
                          <Label htmlFor="deadline-update">Novo prazo</Label>
                          <Input id="deadline-update" type="datetime-local" value={deadlineDraft} disabled={roundData.round.isSettled} onChange={event => setDeadlineDraft(event.target.value)} className="mt-1" />
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700" disabled={roundData.round.isSettled || !deadlineDraft || updateDeadlineMutation.isPending} onClick={handleDeadlineUpdate} title="Guardar a nova data e hora limite">
                          {roundData.round.isSettled ? "Jornada fechada" : updateDeadlineMutation.isPending ? "A guardar…" : "Atualizar prazo"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/70">
                      <CardHeader>
                        <CardTitle className="text-base text-slate-900">Estado dos palpites</CardTitle>
                        <CardDescription>Participantes ativos: {participation?.length ?? 0}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="font-semibold text-emerald-900">Concluíram os 6/6 ({completedParticipants.length})</p>
                          {completedParticipants.length > 0 ? <div className="mt-2 space-y-1 text-sm text-emerald-800">{completedParticipants.map(participant => <p key={participant.userId}>{participant.userName} <span className="font-semibold">({participant.predictionCount}/6)</span></p>)}</div> : <p className="mt-2 text-sm text-emerald-800">Ainda ninguém completou os seis palpites.</p>}
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="font-semibold text-amber-900">Faltam completar ({pendingParticipants.length})</p>
                          {pendingParticipants.length > 0 ? <div className="mt-2 space-y-1 text-sm text-amber-800">{pendingParticipants.map(participant => <p key={participant.userId}>{participant.userName} <span className="font-semibold">({participant.predictionCount}/6)</span></p>)}</div> : <p className="mt-2 text-sm text-amber-800">Todos os participantes completaram a jornada.</p>}
                        </div>
                      </CardContent>
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

                            {roundData.round.isSettled && match.result ? (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-green-800 font-semibold">
                                  Resultado: <span className="text-lg">{match.result}</span>
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="mb-2 text-sm font-medium text-slate-700">{match.result ? `Resultado atual: ${match.result}. Toque numa opção para corrigir.` : "Selecione o resultado oficial."}</p>
                                <div className="flex gap-2">
                                  {["1", "X", "2"].map((result) => {
                                    const selectedResult = resultForm[match.id] ?? match.result;
                                    return <button
                                      key={result}
                                      onClick={() => handleUpdateResult(match.id, result as "1" | "X" | "2")}
                                      disabled={updateResultMutation.isPending}
                                      className={`flex-1 rounded-lg border-2 px-4 py-2 font-semibold transition-all ${selectedResult === result ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"}`}
                                    >
                                      {result}
                                    </button>;
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Calculate Winner Button */}
                    {roundData.matches.every(m => m.result) && !roundData.round.isSettled && (
                      <Button
                        onClick={handleCalculateWinner}
                        disabled={calculateWinnerMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Calcular Vencedor
                      </Button>
                    )}

                    {roundData.round.isSettled && (
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                          {roundData.winners.length > 0 ? (
                            <div className="space-y-1 text-green-800">
                              <p className="font-semibold">✓ {roundData.winners.length} vencedor(es) com seis acertos</p>
                              <p className="text-sm">{roundData.winners.map(winner => winner.userName).join(", ")}</p>
                              {roundData.winners[0]?.prizeShare && (
                                <p className="text-sm font-semibold">Prémio por vencedor: €{Number(roundData.winners[0].prizeShare).toFixed(2)}</p>
                              )}
                            </div>
                          ) : (
                            <p className="font-semibold text-green-800">Jornada fechada sem vencedores.</p>
                          )}
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

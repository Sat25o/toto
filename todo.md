# Liga Portugal Betclic - Prognósticos 34 Jornadas

## Database & Backend

- [x] Schema: Tabelas de utilizadores, jornadas, jogos, apostas, resultados
- [x] Rotas tRPC: Listar jornadas, criar jornada (admin), submeter aposta, atualizar resultado (admin)
- [x] Lógica de bloqueio: Validar deadline antes de aceitar apostas
- [x] Cálculo de vencedores: Identificar acertos e vencedores por jornada
- [x] Classificação geral: Ranking de apostadores por acertos totais
- [x] Testes unitários: Validações de apostas, bloqueio de deadline, cálculo de vencedores

## Frontend - Autenticação & Navegação

- [x] Página de login (OAuth)
- [x] Navegação por role (Admin vs Apostador)
- [x] Logout

## Frontend - Área do Apostador

- [x] Dashboard: Jornada ativa com 6 jogos
- [x] Formulário de apostas: Seleção 1/X/2 por jogo
- [x] Bloqueio visual/funcional após deadline
- [x] Confirmação de aposta submetida
- [x] Histórico de apostas anteriores
- [x] Classificação geral (ranking)

## Frontend - Painel do Admin

- [x] Criar nova jornada: Número, prémio, deadline, 6 jogos
- [x] Listar jornadas criadas
- [x] Formulário de resultados: Entrada 1/X/2 por jogo
- [x] Visualização de apostas de todos os utilizadores
- [x] Identificação automática de vencedor
- [x] Estatísticas gerais

## Frontend - Histórico & Classificação

- [x] Página de histórico: Todas as jornadas com resultados e vencedores
- [x] Página de classificação: Ranking final com total de acertos por apostador
- [x] Detalhes de cada jornada: Apostas de cada utilizador vs resultado oficial

## Design & UX

- [x] Paleta de cores elegante e polida
- [x] Tipografia premium
- [x] Responsivo (PC e telemóvel)
- [x] Animações suaves
- [x] Estados de carregamento e erro

## Deployment

- [x] Checkpoint inicial
- [x] Publicação da plataforma


## Histórico Detalhado de Jornadas

- [x] Página de histórico: Listar todas as jornadas com resultados
- [x] Comparação lado a lado: Palpites de cada utilizador vs resultado oficial
- [x] Indicadores visuais: Acertos/erros destacados com cores
- [x] Filtros: Por jornada, por utilizador

## Notificações por Email

- [x] Tabela de notificações na base de dados
- [x] Rota tRPC para enviar emails
- [x] Email ao criar jornada
- [x] Email quando deadline está próximo (24h antes)
- [x] Email quando resultados são publicados
- [x] Integração com Manus Email API (estrutura pronta, aguarda conector)

## Correção de Autenticação e Convites

- [x] Corrigir schema e migração da tabela de utilizadores para autenticação local
- [x] Implementar sessões seguras por email/password, sem OAuth do Manus
- [x] Restringir o registo a convites únicos emitidos pelo super administrador
- [x] Proteger ricardodonascimento@gmail.com como super administrador não removível
- [x] Atualizar gestão de utilizadores para listar contas, roles, estado e convites
- [x] Cobrir registo por convite, login e proteção do super administrador com testes
- [x] Permitir que um convite válido ative uma conta antiga existente sem duplicar o email

## Correção de Jornadas e Participação Administrativa

- [x] Garantir campos independentes para os seis jogos ao criar uma jornada
- [x] Permitir que administradores submetam palpites e participem nas 34 vagas
- [x] Adicionar acesso aos palpites pessoais a partir do painel administrativo
- [x] Validar criação de jogos e participação administrativa com testes

## Prémio Dividido por Vencedores

- [x] Registar valor informativo do prémio e vários vencedores por jornada
- [x] Calcular e guardar uma parte igual do prémio para cada apostador com seis acertos
- [x] Mostrar vencedores, divisão e jornadas sem vencedor no painel e histórico
- [x] Testar o cenário de dois ou mais vencedores

## Correção de Dados de Teste e Palpites

- [x] Remover a Jornada 1 e os palpites fictícios de teste
- [x] Mostrar data e hora completas do limite de aposta em todas as jornadas
- [x] Atualizar 1/X/2 imediatamente sem refresh e sem seleção fictícia
- [x] Mostrar os nomes reais das equipas em vez de Team A / Team B
- [x] Validar a criação da primeira jornada real

## Correção de Seleção Imediata

- [x] Evitar que a limpeza assíncrona da jornada apague a seleção feita pelo utilizador
- [x] Atualizar visualmente o 1/X/2 no próprio clique e manter a seleção após a resposta do servidor
- [x] Testar seleção imediata depois de abrir uma jornada

## Apostas Públicas e Mobile

- [x] Mostrar todos os participantes com progresso acumulado por jogo
- [x] Marcar elegíveis a amarelo, eliminados a vermelho e vencedores a verde
- [x] Incluir participantes sem palpites na visão pública
- [x] Adaptar a visualização de apostas públicas para telemóvel
- [x] Testar a lógica de estados acumulados e os pontos de quebra mobile

## Revisão Mobile

- [x] Verificar página inicial, login e registo em ecrã de 375 px
- [x] Usar cartões responsivos de uma coluna no telemóvel e grelha progressiva nas Apostas Públicas
- [x] Manter botões, áreas de toque e textos de prazo legíveis em ecrã estreito

## Menu Administrativo Mobile

- [x] Reorganizar ações administrativas em grelha de dois botões por linha no telemóvel
- [x] Remover corte horizontal e adaptar título e subtítulo para ecrãs estreitos
- [x] Validar o menu administrativo a 375 px por inspeção responsiva e compilação sem erros

## Atalho de Apostas Públicas no Dashboard

- [x] Adicionar o botão Apostas Públicas ao menu do apostador
- [x] Manter o menu do Dashboard responsivo em telemóvel

## Jornada Expansível no Dashboard

- [x] Fechar a jornada quando o utilizador volta a clicar no mesmo cartão
- [x] Limpar apenas o estado temporário ao fechar a jornada
- [x] Testar alternância abrir/fechar em telemóvel

## Correção de Convites

- [x] Forçar novos links de convite a usar o domínio público tototalho.me
- [x] Permitir reemitir no painel um convite pendente ou expirado
- [x] Validar diretamente a rota de registo por convite no domínio público

## Eliminação de Apostadores

- [x] Adicionar remoção definitiva de conta e dados associados no servidor
- [x] Proteger super administrador e impedir eliminação da própria conta
- [x] Adicionar confirmação antes de apagar no painel de utilizadores
- [x] Testar a proteção e a remoção segura de dados associados

## Jornadas Expansíveis em Gerir Resultados

- [x] Fechar uma jornada de resultados ao tocar novamente no respetivo cartão
- [x] Reutilizar a lógica de alternância já validada no Dashboard
- [x] Validar a seleção de resultados em telemóvel após a alteração

## Gestão de Resultados e Participação

- [x] Permitir alterar um resultado oficial antes de fechar a jornada
- [x] Bloquear alterações de resultado depois de calcular os vencedores
- [x] Mostrar o progresso individual de palpites de 0/6 a 6/6 no Dashboard
- [x] Mostrar ao administrador quem completou os seis palpites e quem ainda falta apostar
- [x] Testar correção de resultados, progresso e estados de participação

## Regras e Mensagens Administrativas

- [x] Criar regras editáveis e visíveis a todos os apostadores
- [x] Guardar as regras iniciais da Liga Toto Talho
- [x] Criar mensagens administrativas publicadas no Dashboard
- [x] Permitir ao administrador criar, editar, fixar e remover mensagens
- [x] Adicionar acessos a Regras e Mensagens nas áreas de administração e apostador
- [x] Testar a gestão e a apresentação de regras e avisos

## Edição do Prazo de Apostas

- [x] Permitir ao administrador editar a data e a hora limite de uma jornada aberta
- [x] Impedir alterações de prazo após a jornada estar fechada
- [x] Atualizar imediatamente o prazo apresentado aos apostadores
- [x] Testar validação de prazo futuro e bloqueio após fecho

## Instalação da App

- [x] Criar manifesto e ícone de instalação para Liga Toto Talho
- [x] Registar o serviço de instalação PWA
- [x] Adicionar botão Instalar App com instruções para iPhone
- [x] Testar o botão e a apresentação mobile

## Estabilidade da App Instalada

- [x] Eliminar cache de recursos JavaScript que pode misturar versões da app
- [x] Atualizar o service worker sem reutilizar ficheiros antigos
- [x] Permitir recuperar a app limpando cache e recarregando em caso de erro
- [x] Testar a atualização segura após nova versão publicada

## Notificações Push

- [x] Registar subscrições push e preferências de notificação por participante — adiado por decisão do administrador, por faltar configuração VAPID
- [x] Adicionar botão para ativar ou desativar notificações no Dashboard — adiado por decisão do administrador, por faltar configuração VAPID
- [x] Enviar push ao criar jornada, publicar aviso e apurar vencedores — adiado por decisão do administrador, por faltar configuração VAPID
- [x] Criar tratamento de subscrições inválidas e controlo de autorização — adiado por decisão do administrador, por faltar configuração VAPID
- [x] Testar a entrega de notificações e os três eventos automáticos — adiado por decisão do administrador, por faltar configuração VAPID

## Ordem Pessoal nas Apostas Públicas

- [x] Mostrar o próprio apostador em primeiro lugar
- [x] Manter os restantes apostadores numa ordem consistente
- [x] Testar a ordenação para utilizadores diferentes

## Instalação Segura e Consulta Pública

- [x] Explicar que a instalação é uma app web e não requer APK
- [x] Destacar o cartão Os meus palpites nas Apostas Públicas
- [x] Adicionar pesquisa por nome de apostador
- [x] Adicionar filtros Em jogo, Eliminado e Vencedor
- [x] Testar filtros e experiência de telemóvel

## Eliminação por Palpites Incompletos

- [x] Marcar como eliminados participantes com menos de seis palpites após o prazo
- [x] Diferenciar visualmente a eliminação por falta de palpites
- [x] Testar participantes completos, incompletos e sem palpites

## Resumo das Apostas Públicas

- [x] Mostrar total de apostadores em jogo e eliminados
- [x] Mostrar os nomes de todos os vencedores quando existirem
- [x] Adaptar o resumo a ecrãs de telemóvel
- [x] Testar resumo sem vencedor, com um vencedor e com vencedores múltiplos

## Resumo Interativo das Apostas Públicas

- [x] Mover pesquisa de apostadores para o Resumo da jornada
- [x] Transformar os cartões Em jogo, Eliminados e Vencedores em filtros
- [x] Remover a caixa redundante Estado dos apostadores
- [x] Testar filtros no resumo em telemóvel

## Instalação Segura em Samsung

- [x] Detetar Samsung Internet e evitar o pedido de instalação que aciona Play Protect
- [x] Mostrar instruções oficiais para criar atalho no ecrã inicial
- [x] Testar o fluxo Samsung e os fluxos de outros navegadores

## Guia de Instalação e Ajuda

- [x] Criar guia visual Samsung na página inicial
- [x] Detetar Samsung Internet, Chrome Android, Safari iPhone e outros navegadores
- [x] Criar página de ajuda com perguntas frequentes
- [x] Adicionar acesso à ajuda a partir da página inicial
- [x] Testar os guias e a navegação em telemóvel

## Ecrã Inicial Samsung Bloqueado

- [x] Explicar como desbloquear temporariamente o esquema do ecrã inicial
- [x] Adicionar solução ao guia Samsung e às perguntas frequentes
- [x] Testar a orientação em telemóvel

## Página Inicial Privada

- [x] Remover conteúdo público, guias e informação promocional da página inicial
- [x] Manter apenas o botão Entrar para o grupo privado
- [x] Validar a entrada minimalista em telemóvel e computador

## Limpeza Visual do Login

- [x] Remover elementos vazios deixados pelas edições visuais no ecrã de login
- [x] Validar o formulário de login simplificado em telemóvel e computador

## Finalização do Login Minimalista

- [x] Remover o rodapé vazio depois da remoção do texto
- [x] Validar a apresentação final do formulário de login

## Correção de Jogos em Jornadas

- [x] Permitir ao administrador editar as equipas dos seis jogos de uma jornada aberta
- [x] Bloquear a edição após prazo, palpites, resultados oficiais ou fecho da jornada
- [x] Adicionar controlos de correção de jogos no painel de administração
- [x] Testar as regras de proteção e validar a experiência em telemóvel e computador

## Histórico e Classificação por Acertos

- [x] Manter no histórico a indicação de vencedores ou ausência de vencedor
- [x] Remover a apresentação dos resultados oficiais dos jogos no histórico
- [x] Mostrar os palpites de todos os participantes identificados pelo nome
- [x] Destacar a classificação geral acumulada por total de acertos
- [x] Testar a ordenação acumulada e a apresentação em telemóvel e computador

## Organização do Histórico

- [x] Mostrar as jornadas e os respetivos palpites acima da Classificação Geral
- [x] Permitir abrir e fechar a mesma jornada ao tocar novamente no cartão
- [x] Validar a organização e a alternância em telemóvel e computador

## Início da Classificação na Jornada 2

- [x] Excluir os acertos da Jornada 1 da Classificação Geral
- [x] Contar apenas os acertos desde a Jornada 2 em diante
- [x] Indicar na interface que a classificação começa na Jornada 2
- [x] Testar o estado inicial a zero e o início da contagem na Jornada 2

## Resultados e Acertos no Histórico

- [x] Mostrar o resultado final por baixo de cada jogo no quadro de palpites
- [x] Destacar palpites certos a verde e palpites errados a vermelho
- [x] Validar a leitura das cores e dos resultados em telemóvel e computador

## Separação entre Histórico e Classificação

- [x] Remover o quadro de Classificação Geral da página de Histórico
- [x] Remover o atalho Histórico do menu de administração
- [x] Validar a navegação e a página de Histórico simplificada

## Ordem dos Botões do Dashboard

- [x] Reorganizar os atalhos por prioridade de utilização
- [x] Ocultar o atalho Histórico no Dashboard quando o utilizador for administrador
- [x] Validar os atalhos em telemóvel e computador

## Ícones no Menu do Dashboard

- [x] Restaurar o Histórico no Dashboard de administradores
- [x] Adicionar ícones aos botões Administração, Apostas Públicas, Classificação e Histórico
- [x] Confirmar que todos os atalhos principais têm ícones consistentes

## Coluna Fixa no Histórico

- [x] Fixar a coluna Jogo durante o deslize horizontal dos palpites
- [x] Manter equipas e resultado final legíveis na coluna fixa
- [x] Validar a deslocação horizontal em telemóvel e computador

## Sessão Persistente

- [x] Renovar a sessão segura por sete dias quando a aplicação é utilizada
- [x] Manter a expiração do token e do cookie alinhada em sete dias
- [x] Testar a renovação e o encerramento da sessão

## Aba Copiaços

- [x] Agrupar boletins completos com os mesmos seis palpites após o fecho da jornada
- [x] Mostrar os grupos na nova aba Copiaços dentro das Apostas Públicas
- [x] Mostrar estado vazio quando não existirem palpites totalmente iguais
- [x] Testar a deteção de boletins iguais e a visibilidade após o fecho

## Detalhe de Copiaços

- [x] Permitir abrir e fechar o detalhe de cada grupo de boletim igual
- [x] Mostrar os seis jogos e o palpite comum do grupo
- [x] Testar a alternância de detalhe e validar a apresentação

## Posição do Detalhe de Copiaços

- [x] Mostrar a Aposta comum logo por baixo do grupo de Copiaços selecionado
- [x] Manter a abertura e o fecho do detalhe no próprio cartão
- [x] Validar a posição do detalhe em telemóvel e computador

## Comparação de Grupos de Copiaços

- [x] Permitir manter abertos vários grupos de Copiaços ao mesmo tempo
- [x] Adicionar controlos para abrir e fechar todos os grupos
- [x] Validar a comparação de vários boletins em simultâneo

## Recuperação Manual de Palavra-passe

- [x] Registar quando uma conta recebe uma palavra-passe provisória
- [x] Permitir ao administrador definir uma palavra-passe provisória para uma conta elegível
- [x] Obrigar o participante a alterar a palavra-passe provisória no Dashboard
- [x] Testar a recuperação, alteração e proteção da conta de super administrador

## Gestão de Convites e Nomes

- [x] Ocultar da lista os convites já aceites
- [x] Permitir apagar convites pendentes ou expirados
- [x] Permitir editar o nome de participantes registados
- [x] Testar as permissões e atualizações de convites e nomes

## Liga dos Campeões

- [x] Criar uma aba com o formato de eliminatórias para os 16 melhores classificados
- [x] Explicar qualificação após a Jornada 13, fases e objetivo de final perto do Natal
- [x] Integrar o acesso no menu principal com ícone próprio
- [x] Testar a estrutura do calendário e validar a página em telemóvel e computador

## Quadro Automático da Liga dos Campeões

- [x] Guardar os 16 qualificados quando a Jornada 13 é finalizada
- [x] Gerar automaticamente os confrontos de oitavos e os lugares das fases seguintes
- [x] Mostrar o quadro real com qualificados e confrontos na aba Liga dos Campeões
- [x] Testar a qualificação automática, emparelhamentos e quadro inicial

## Alternância de Jornadas Públicas

- [x] Permitir fechar a mesma jornada ao tocar novamente no cartão
- [x] Validar a abertura e o fecho das Apostas Públicas

## Movimento na Classificação

- [x] Comparar a posição atual com a classificação antes da última jornada finalizada
- [x] Mostrar indicadores de subida, descida e posição estável
- [x] Testar a variação de posições e a apresentação do ranking

## Jogos Adiados e Prémio Acumulado

- [x] Permitir marcar um jogo como adiado/anulado para a jornada
- [x] Calcular vencedores, classificação e estados públicos apenas pelos jogos válidos
- [x] Acumular automaticamente o prémio sem vencedor para a jornada seguinte
- [x] Mostrar claramente o jogo adiado nas áreas de administração, histórico e apostas públicas
- [x] Testar o fecho de jornada com jogo adiado e a transição do prémio

## Jogo Suplente para Novas Jornadas

- [x] Preservar as Jornadas 1 e 2 atuais com os seis jogos já definidos
- [x] Permitir criar jornadas novas com seis jogos principais e um jogo suplente
- [x] Ativar o jogo suplente automaticamente quando um jogo principal é adiado
- [x] Contar sempre seis jogos ativos em classificação, vencedor e prémio
- [x] Testar jornadas novas com e sem adiamento de jogo principal

## Regra de Jogos Adiados

- [x] Adicionar uma regra ativa e editável sobre adiamentos e jogo suplente

## Múltiplos Jogos Adiados

- [x] Permitir marcar mais do que um jogo principal como adiado
- [x] Usar o jogo suplente disponível e fechar com os restantes jogos válidos
- [x] Calcular vencedor, classificação e prémio pelos jogos efetivamente válidos
- [x] Atualizar a informação pública e administrativa sobre múltiplos adiamentos
- [x] Testar o fecho com vários jogos adiados

## Classificação em Direto

- [x] Calcular acertos provisórios pelos resultados já registados em jornadas em curso
- [x] Recalcular o ranking em direto sem alterar a classificação oficial
- [x] Mostrar a classificação provisória e o número de jogos atualizados
- [x] Testar a atualização após cada resultado e a preservação do ranking oficial

## Design Móvel da Classificação

- [x] Substituir as tabelas largas por cartões compactos em telemóvel
- [x] Mostrar posição, nome, movimento e acertos sem corte de conteúdo
- [x] Preservar a tabela detalhada para computador
- [x] Validar a Classificação em telemóvel e computador

## Seletores de Equipas Liga Betclic

- [x] Disponibilizar as 18 equipas da Liga Betclic nos seis jogos principais
- [x] Manter campos livres no sétimo jogo suplente para equipas de qualquer liga
- [x] Testar a lista de equipas e a criação de sete jogos

## Simplificação do Prémio

- [x] Remover o campo opcional de descrição do prémio do formulário
- [x] Preservar o valor, divisão e acumulação automática do prémio
- [x] Testar a criação de jornadas sem descrição de prémio

## Prémio Automático

- [x] Definir 170 € como valor base fixo de cada jornada
- [x] Acumular automaticamente o valor total após uma jornada sem vencedor
- [x] Recomeçar o prémio em 170 € depois de uma jornada com vencedor
- [x] Remover a introdução manual do valor do prémio
- [x] Testar a sequência 170 € → 340 € → 510 € e o reinício após vitória

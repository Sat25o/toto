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

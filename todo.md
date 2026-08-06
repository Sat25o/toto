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
- [ ] Publicação da plataforma

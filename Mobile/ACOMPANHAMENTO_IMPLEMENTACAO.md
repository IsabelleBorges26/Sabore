# Acompanhamento de Implementação — Saboré Mobile (Flutter & Dart)

Este documento registra o inventário completo das funcionalidades do **Saboré Web** (`Front-End/` e `Back-End/`), a correspondência 1:1 com os módulos e telas do **Saboré Mobile** (`Mobile/sabore_app/sabore_flutter/`), o checklist oficial de implementação e testes, as integrações de Inteligência Artificial e banco de dados, e as correções aplicadas.

---

## 1. Checklist Oficial de Funcionalidades (Paridade 1:1 com o Saboré Web)

Legenda de status utilizada neste documento:
- `- [ ] Não implementado.`
- `- [ ] Em desenvolvimento.`
- `- [ ] Implementado, aguardando teste.`
- `- [x] Implementado e testado com sucesso.`
- `- [!] Bloqueado por dependência externa.`

### 1.1. Inteligência Artificial — Prioridade Máxima (`/ia` e `/importacao`)
- [x] Implementado e testado com sucesso. — **Chef IA — Geração de Receitas Reais (`POST /ia/gerar`)**: Integração em tempo real com OpenRouter (`openrouter/free`), enviando ingredientes da Geladeira, tempo máximo, restrições alimentares, dificuldade, porções, bio e preferências do usuário (`screens/chef_ia_screen.dart` e `services/api_service.dart`).
- [x] Implementado e testado com sucesso. — **Chef IA — Modo Conversacional & Sugestões (`POST /ia/gerar` com `isRecipe: false`)**: Suporte completo a bate-papo culinário, dúvidas e listas de sugestões estruturadas, além de geração de receita estruturada (`isRecipe: true`) com botão "Salvar esta Receita" e "Modo Passo a Passo".
- [x] Implementado e testado com sucesso. — **Scanner IA por Foto — Reconhecimento Visual de Pratos e Ingredientes (`POST /ia/analisar-foto`)**: Conversão automática de fotos do dispositivo ou pratos de demonstração para Data URI Base64 (`ensureBase64DataUri`), análise real via OpenRouter Visão com barras de porcentagem de confiança (`screens/ia_fotos_screen.dart`).
- [x] Implementado e testado com sucesso. — **Scanner IA por Foto — Receita a partir da Foto (`POST /ia/gerar-receita-foto`)**: Geração real da receita completa com base no prato e ingredientes detectados na imagem, respeitando restrições alimentares e porções configuradas pelo usuário.
- [x] Implementado e testado com sucesso. — **Importador de Vídeos Culinários do YouTube (`POST /importacao/importar`)**: Extração real de título, canal, thumbnail, descrição/transcrição de vídeos do YouTube via HTTPS + estruturação completa de ingredientes e modo de preparo via OpenRouter IA (`screens/import_video_screen.dart`).
- [x] Implementado e testado com sucesso. — **Controle Real de Créditos e Cotas de IA (`GET /ia/consumo`)**: Exibição em tempo real dos créditos mensais do plano FREE (`5/mês` no Chef IA, `2/mês` no Scanner por Foto, `2/mês` no Importador de Vídeo) e status ilimitado no plano Saboré PRO (`widgets/sabore_widgets.dart`).

### 1.2. Autenticação, Sessão e Segurança (`Supabase Auth` + `/usuarios`)
- [x] Implementado e testado com sucesso. — **Login com E-mail e Senha (`/auth/v1/token?grant_type=password`)**: Autenticação direta no Supabase Auth com sincronização imediata do perfil no Back-End (`GET /usuarios/perfil`).
- [x] Implementado e testado com sucesso. — **Cadastro de Conta com Criação Automática dos 5 Livros Padrão (`/auth/v1/signup`)**: Criação de conta no Supabase Auth e provisionamento automático do usuário e coleções iniciais no banco (`screens/auth_screens.dart`).
- [x] Implementado e testado com sucesso. — **Login Social com Google e Facebook (`signInWithOAuth`)**: Fluxo OAuth real com captura de `#access_token` em `web/index.html` (`window.__saboreInitialHash`) no Flutter Web e callback local no Desktop (`services/oauth_helper*.dart`).
- [x] Implementado e testado com sucesso. — **Recuperação de Senha (`/auth/v1/recover`)**: Disparo real de e-mail de redefinição pelo Supabase Auth.
- [x] Implementado e testado com sucesso. — **Persistência de Sessão e Expiração por Inatividade (10 minutos)**: Armazenamento em `window.localStorage` (Web) e JSON local (Mobile/Desktop), com monitor de inatividade de 10 minutos idêntico ao `SESSION_IDLE_MS` do `Front-End/assets/js/api.js`.

### 1.3. Banco de Dados Único e Sincronização Web ↔ Mobile (`Supabase PostgreSQL`)
- [x] Implementado e testado com sucesso. — **Sincronização Direta com o Banco Supabase (`https://dzumxhfglusinxtyflwb.supabase.co`)**: Carregamento das 26 receitas reais do banco Supabase, usuários, livros, favoritos, avaliações, comentários, geladeira, desafios e ranking.
- [x] Implementado e testado com sucesso. — **Launcher Resiliente de Banco e IA (`Mobile/start_backend_mobile.js`)**: Inicializa o `Back-End/server.js` oficial na porta `3000` sem alterar nenhum arquivo do Web/Back-End e ativa automaticamente a ponte HTTPS REST (`/rest/v1/`) sempre que a rede Wi-Fi local bloquear a porta TCP `6543`/`5432` do PostgreSQL, eliminando erros HTTP 503.

### 1.4. Telas, Cards Mobile Redesenhados e Módulos do Sistema
- [x] Implementado e testado com sucesso. — **Landing Page Pública, Sobre Nós, Contato e Modais Legais LGPD** (`GET /estatisticas/publicas`, `POST /contato` em `screens/landing_screen.dart` e `widgets/institutional_modals.dart`).
- [x] Implementado e testado com sucesso. — **Dashboard Shell, Navegação Mobile, Notificações e Selos FREE/PRO** (`screens/dashboard_shell.dart`, `widgets/notifications_modal.dart`).
- [x] Implementado e testado com sucesso. — **Home / Cozinha Inteligente & Geladeira/Despensa** (`GET/POST/DELETE /ingredientes-disponiveis`, cards de estatísticas, atalhos de IA e destaques em `screens/home_screen.dart`).
- [x] Implementado e testado com sucesso. — **Redesign Mobile-Native dos Cards de Receitas (`SaboreMobileRecipeCard`)**: Novo componente mobile em `widgets/sabore_widgets.dart` com miniatura destacada, pílula de tempo sobre a foto, selo IA, tags coloridas de categoria e dificuldade, avatar do autor com moldura, nota média com estrela e botões táteis de favoritar e salvar em livro.
- [x] Implementado e testado com sucesso. — **Meus Livros de Receitas & Cadastro Manual com Foto** (`GET/POST/DELETE /livros`, `GET/POST/PUT/DELETE /receitas` em `screens/books_screen.dart`).
- [x] Implementado e testado com sucesso. — **Comunidade Saboré — Feed, Hashtags em Alta 🔥, Busca e Chefs em Destaque** (`GET /receitas/publicas`, `GET /receitas/hashtags-em-alta`, `GET /social/perfis`, `POST/DELETE /social/seguir/:id` em `screens/community_screen.dart` e `widgets/chef_profile_modal.dart`).
- [x] Implementado e testado com sucesso. — **Modal de Detalhes da Receita — Modo Passo a Passo, Checkboxes de Ingredientes, Avaliações 1-5 Estrelas, Comentários e Compartilhamento** (`/avaliacoes`, `/comentarios`, `/compartilhamento` em `widgets/recipe_detail_modal.dart`).
- [x] Implementado e testado com sucesso. — **Desafio Gastronômico da Semana (+30 pts PRO)** (`GET /desafios/semanal/atual`, `GET /desafios/historico`, `POST /desafios/publicar` com upload real de foto e pré-visualização em `screens/community_screen.dart`).
- [x] Implementado e testado com sucesso. — **Eventos Especiais Sazonais (Natal 2026 & Réveillon 2027)** (`GET /desafios/eventos`, `POST /desafios/eventos/:id/inscrever`, `POST /desafios/eventos/:id/votar`, `POST /desafios/eventos/:id/denunciar` em `screens/community_screen.dart`).
- [x] Implementado e testado com sucesso. — **Receitas Favoritas com Filtro por Categoria e Busca** (`GET/POST/DELETE /favoritos` em `screens/favorites_screen.dart`).
- [x] Implementado e testado com sucesso. — **Ranking PRO & Menu PRO Unificado (Top 5 G-5, Comparativo FREE vs PRO, Regras e Extrato de Pontos)** (`GET /planos/ranking`, `GET /planos/historico-atividades` em `screens/ranking_pro_screen.dart`).
- [x] Implementado e testado com sucesso. — **Perfil do Chef, Molduras Comemorativas, Emblemas, Seguidores/Seguindo e Grade de Criações** (`GET /usuarios/perfil`, `GET /usuarios/molduras`, `PUT /usuarios/equipar-moldura`, `GET /usuarios/conquistas` em `screens/profile_screen.dart`).
- [x] Implementado e testado com sucesso. — **Configurações da Conta, Preferências Padrão de IA, Restrições Alimentares e Exclusão de Conta (LGPD)** (`PUT /usuarios/atualizar/:id`, `DELETE /usuarios/excluir/:id` em `screens/settings_screen.dart`).
- [x] Implementado e testado com sucesso. — **Painel Administrativo Completo (3 Abas: Ranking & Fechamento Mensal, Desafios Semanais, Eventos Especiais & Auditoria)** (`screens/admin_screen.dart`).

---

## 2. Mapeamento Completo Web ↔ Mobile e Endpoints Reais

| Módulo / Página Web (`Front-End/`) | Endpoints Reais (`Back-End/src/routes/`) | Arquivo(s) Mobile (`Mobile/sabore_app/sabore_flutter/lib/`) | Status |
| :--- | :--- | :--- | :--- |
| **Landing Page Pública** (`Front-End/inicial/`) | `GET /estatisticas/publicas`<br>`POST /contato` | `screens/landing_screen.dart`<br>`widgets/institutional_modals.dart` | `[x] Testado` |
| **Sobre Nós & Conteúdo Legal (LGPD)** (`Front-End/sobre/`, `Front-End/conteudo-legal/`) | Conteúdo Oficial Institucional & LGPD | `widgets/institutional_modals.dart`<br>`screens/landing_screen.dart`<br>`screens/settings_screen.dart` | `[x] Testado` |
| **Autenticação (Login, Cadastro, Google, Facebook)** (`Front-End/login/`) | Supabase Auth (`/auth/v1/*`)<br>`GET /usuarios/perfil` | `screens/auth_screens.dart`<br>`services/api_service.dart`<br>`services/oauth_helper*.dart` | `[x] Testado` |
| **Dashboard Shell (Sidebar, Topbar, Notificações)** (`Front-End/Dashboard/index.html`) | `GET /usuarios/perfil`<br>`GET /social/notificacoes` | `screens/dashboard_shell.dart`<br>`widgets/notifications_modal.dart` | `[x] Testado` |
| **Aba Início / Home & Geladeira** (`Front-End/Dashboard/inicio/`) | `GET/POST/DELETE /ingredientes-disponiveis/*`<br>`GET /receitas/publicas` | `screens/home_screen.dart`<br>`widgets/sabore_widgets.dart` | `[x] Testado` |
| **Aba Meus Livros & Receitas** (`Front-End/Dashboard/livros/`) | `GET/POST/DELETE /livros/*`<br>`GET/POST/PUT/DELETE /receitas/*` | `screens/books_screen.dart`<br>`widgets/recipe_detail_modal.dart` | `[x] Testado` |
| **Aba Comunidade, Desafios & Eventos** (`Front-End/Dashboard/explorar/`) | `GET /receitas/publicas`<br>`GET /receitas/hashtags-em-alta`<br>`GET /social/perfis`<br>`GET/POST /desafios/*` | `screens/community_screen.dart`<br>`widgets/chef_profile_modal.dart` | `[x] Testado` |
| **Aba Chef IA** (`Front-End/Dashboard/chefIA/`) | `GET /ia/consumo`<br>`POST /ia/gerar` | `screens/chef_ia_screen.dart` | `[x] Testado` |
| **Aba Scanner IA por Foto** (`Front-End/Dashboard/ia-fotos/`) | `GET /ia/consumo`<br>`POST /ia/analisar-foto`<br>`POST /ia/gerar-receita-foto` | `screens/ia_fotos_screen.dart` | `[x] Testado` |
| **Aba Importar Vídeo** (`Front-End/Dashboard/importar/`) | `GET /ia/consumo`<br>`POST /importacao/importar` | `screens/import_video_screen.dart` | `[x] Testado` |
| **Aba Favoritas** (`Front-End/Dashboard/favoritos/`) | `GET/POST/DELETE /favoritos/*` | `screens/favorites_screen.dart` | `[x] Testado` |
| **Aba Ranking PRO & Menu PRO** (`Front-End/Dashboard/ranking/`) | `GET /planos/ranking`<br>`GET /planos/historico-atividades` | `screens/ranking_pro_screen.dart` | `[x] Testado` |
| **Aba Perfil, Molduras & Conquistas** (`Front-End/Dashboard/perfil/`) | `GET /usuarios/perfil`<br>`GET/PUT /usuarios/molduras`<br>`GET /usuarios/conquistas` | `screens/profile_screen.dart` | `[x] Testado` |
| **Aba Configurações & LGPD** (`Front-End/Dashboard/configuracoes/`) | `PUT /usuarios/atualizar/:id`<br>`DELETE /usuarios/excluir/:id` | `screens/settings_screen.dart` | `[x] Testado` |
| **Painel Administrativo** (`Front-End/Dashboard/admin/`) | `GET/POST /planos/admin/*`<br>`GET/POST /desafios/semanal/admin/*`<br>`POST /desafios/eventos/:id/*` | `screens/admin_screen.dart` | `[x] Testado` |

---

## 3. Resultados dos Testes Executados

1. **`flutter pub get`**: Concluído com sucesso sem conflitos de dependências.
2. **`dart analyze`**: `No issues found!` (0 erros, 0 warnings, 0 lints).
3. **`flutter test`**: Todos os testes automatizados em `test/sabore_mobile_test.dart` aprovados (`All tests passed!`).
4. **Teste de Integração Real com Backend e IA (`http://localhost:3000`)**:
   - `GET /estatisticas/publicas` → `HTTP 200` (`26 receitas` sincronizadas do Supabase).
   - `GET /receitas/publicas` → `HTTP 200` (`16 receitas públicas` carregadas do Supabase).
   - `GET /usuarios/perfil` → `HTTP 200` (Perfil + estatísticas + engajamento + conquistas).
   - `GET /ia/consumo` → `HTTP 200` (Cotas reais por plano FREE/PRO).
   - `POST /ia/gerar` → `HTTP 200` (Receita real gerada via OpenRouter `openrouter/free`).
   - `POST /ia/analisar-foto` & `POST /ia/gerar-receita-foto` → `HTTP 200` (Análise visual com % de confiança + receita completa gerada via OpenRouter).
   - `POST /importacao/importar` → `HTTP 200` (Extração real de vídeo do YouTube + estruturação de ingredientes e passos via OpenRouter).
   - `GET /livros/listar`, `GET /desafios/semanal/atual`, `GET /desafios/eventos`, `GET /planos/ranking` → `HTTP 200`.

---

## 4. Preservação Total do Projeto Web

- **Regra Inegociável Cumprida**: Nenhum arquivo de `Front-End/`, `Back-End/` ou da raiz do projeto foi modificado, formatado, movido ou removido. Todas as implementações foram realizadas exclusivamente dentro da pasta `Mobile/`.

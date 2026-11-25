# Saboré Mobile (Flutter & Dart)

Aplicativo mobile oficial da plataforma **Saboré — Cozinha Inteligente com IA**, desenvolvido em **Flutter & Dart** com fidelidade visual absoluta ao **Saboré Web** e integração 100% real com o Back-End Node.js/Express, Prisma/PostgreSQL e Supabase Auth.

---

## 🎨 Identidade Visual (Paleta Oficial Saboré)

- **Verde Esmeralda Profundo (`--dark`)**: `#1B2B27`
- **Verde Obsidiana (`--dark-deep`)**: `#121F1C`
- **Card Glassmorphic (`--dark-card`)**: `#213530`
- **Coral / Terracota (`--accent`)**: `#E0857A`
- **Champagne (`--secondary`)**: `#F0D5B6`
- **Ouro Metálico PRO**: `#FFD700` → `#FFA500`
- **Tipografia**: `Playfair Display` (Títulos), `DM Sans` (Interface/Corpo), `DM Mono` (Métricas e Ranking)

---

## 📱 Módulos e Funcionalidades Implementadas

1. **Landing Page & Fale Conosco (`/estatisticas/publicas`, `/contato`)**:
   - Apresentação completa do ecossistema, métricas públicas em tempo real e formulário de contato integrado ao banco de dados.
2. **Autenticação Real (`Supabase Auth` + `/usuarios/perfil` + `/usuarios/cadastrar`)**:
   - Login com persistência de sessão (`sabore_token`), cadastro com indicador de força de senha em 4 níveis, recuperação de senha por e-mail e seletor de servidor API (Produção Vercel ou Localhost).
3. **Home / Dashboard (`/ingredientes-disponiveis`, `/receitas/publicas`, `/desafios/atual`)**:
   - Saudação personalizada, badge `FREE` / `PRO`, 4 cards de estatísticas, atalhos rápidos para as ferramentas de IA, **Geladeira & Despensa Inteligente** interativa e receitas recomendadas.
4. **Meus Livros de Receitas (`/livros/*`, `/receitas/*`)**:
   - Listagem de coleções com busca, filtros e ordenação, criação de livros com seletor de ícones, visualização de receitas de cada livro e cadastro manual de receitas com upload de foto (`Base64`), ingredientes dinâmicos e **Modo Passo a Passo**.
5. **Comunidade, Desafio Semanal & Eventos Especiais (`/receitas/publicas`, `/desafios/*`, `/social/*`)**:
   - **Feed da Comunidade**: Abas *"Para Você"* e *"Seguindo"*, busca por texto/categoria, hashtags em alta, carrossel de *Chefs em Destaque* com botão Seguir/Deixar de Seguir, modal de perfil do Chef, avaliação de 1 a 5 estrelas (`/avaliacoes`), comentários (`/comentarios`), favoritar (`/favoritos`) e salvar receita em livro.
   - **Desafio da Semana**: Card do desafio ativo (+30 pts PRO), modal completo de participação com botão **"Escolher arquivo"**, pré-visualização da foto, nome/tamanho do arquivo, botão de remoção, validação de envio (`POST /desafios/publicar`), galeria da comunidade e histórico (`/desafios/historico`).
   - **Eventos Especiais**: Competições sazonais (*Ceia de Natal 2026*, *Sabor da Virada 2027*), inscrição de receitas e votação aberta.
6. **Chef IA (`/ia/gerar`, `/ia/consumo`)**:
   - Contador mensal de créditos (`5 msgs/mês` no plano FREE ou `Ilimitado` no PRO), integração direta com os ingredientes da Geladeira, filtros de tempo máximo e restrição alimentar, histórico persistente de conversa e card de receita interativo com botão *"Salvar esta Receita"*.
7. **IA por Foto (`/ia/analisar-foto`, `/ia/gerar-receita-foto`)**:
   - Contador de créditos (`2 créditos/mês` no FREE ou `Ilimitado` no PRO), upload de foto do prato + pratos de demonstração, scanner com barras de confiança (`%`) por ingrediente e geração de receita completa.
8. **Importar Vídeo (`/importacao/importar`)**:
   - Contador de créditos (`2 créditos/mês` no FREE ou `Ilimitado` no PRO), extração automática de ingredientes e modo de preparo a partir de links do YouTube.
9. **Favoritas (`/favoritos/*`)**:
   - Filtro por categorias, busca rápida e gerenciamento de receitas favoritas.
10. **Meu Perfil (`/usuarios/perfil`, `/usuarios/conquistas`, `/usuarios/molduras`)**:
    - Upload/remoção de foto de perfil, seletor de molduras comemorativas (`moldura-natal-2026`, `moldura-reveillon-2027`), emblemas conquistados, modal de Seguidores/Seguindo, mini-card de desempenho no Ranking PRO, bio culinária, tags de especialidades e grid *Minhas Criações*.
11. **Ranking PRO (`/planos/ranking`, `/planos/historico-atividades`)**:
    - Tela unificada do Menu PRO & Ranking de Mérito Mensal, faixa de posição do usuário, comparativo completo `FREE` vs `Saboré PRO`, Pódio Top 5 (`G-5`), tabela geral, regras de pontuação e extrato individual de pontos.
12. **Configurações & Painel Admin (`/usuarios/atualizar/:id`, `/planos/admin/*`)**:
    - Atualização de nome, e-mail e senha, preferências padrão do Chef IA (dificuldade, porções e 6 restrições alimentares), switches de notificações e Painel Administrativo para fechamento mensal e gestão de desafios.

---

## 🚀 Como Executar

```bash
# Na raiz do repositório: inicia a API compartilhada e abre o Flutter Web no Chrome
npm run fluuter

# Para rodar o app nativo no Android/iOS
cd Mobile/sabore_app
flutter pub get
flutter run
```

## Conexão com o backend compartilhado

O mobile usa a mesma API Saboré que atende o site e, por meio dela, o mesmo banco PostgreSQL/Supabase. Para celular físico, configure a URL pública HTTPS do backend na tela de login (ícone de conexão) antes de entrar. Em Android Emulator, `http://10.0.2.2:3000` aponta para o computador; em Flutter Web hospedado junto à API, a origem é detectada automaticamente.

Também é possível definir o endereço ao compilar o app nativo:

```bash
flutter build apk --dart-define=SABORE_API_URL=https://seu-dominio-da-api
```

Use o botão Salvar na configuração de servidor para testar `GET /estatisticas/publicas`. O login só abre o dashboard após carregar o perfil real pela API.

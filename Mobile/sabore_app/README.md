# Saboré — App de Receitas (Flutter)

Projeto Flutter completo baseado no protótipo enviado, com 7 telas,
tema centralizado e dados fictícios prontos para serem substituídos
por uma API real no futuro.

## Como rodar

1. Extraia o zip em uma pasta.
2. Abra a pasta `sabore_app` no VS Code ou Android Studio.
3. No terminal, dentro da pasta do projeto, rode:

```bash
flutter pub get
flutter run
```

> Se for a primeira vez usando este projeto, garanta que o Flutter SDK
> esteja instalado (`flutter doctor`) e que exista um emulador/dispositivo
> conectado.

## Estrutura

```
lib/
  main.dart                     -> ponto de entrada
  app.dart                      -> MaterialApp e rota inicial (Login)
  theme/                        -> cores, tipografia, espaçamentos, ThemeData
  models/                       -> Recipe, AppUser
  data/mock_data.dart           -> dados fictícios (fácil de substituir por API)
  services/recipe_service.dart  -> regras de negócio (favoritar, buscar, publicar)
  widgets/                      -> AppBottomNavBar, RecipeCard, AppTextField, TagChip
  screens/
    login_screen.dart
    main_navigation_screen.dart -> controla a barra inferior
    home_screen.dart
    recipe_detail_screen.dart
    profile_screen.dart
    search_screen.dart
    search_not_found_screen.dart
    publish_recipe_screen.dart
    favorites_screen.dart
```

## Telas e cores (extraídas do protótipo)

| Tela | Cor de fundo |
|---|---|
| Login | Verde-escuro (`AppColors.darkGreen`) |
| Início | Rosa queimado (`AppColors.rose`) |
| Detalhes da receita | Dourado (`AppColors.gold`) |
| Perfil / Livro de receitas | Verde-escuro |
| Busca | Rosa queimado |
| Publicar receita | Rosa queimado |
| Resultado não encontrado | Verde-escuro |

Todas as cores estão centralizadas em `lib/theme/app_colors.dart`.

## Funcionalidades implementadas

- Login visual (navega para a tela principal).
- Navegação por barra inferior com botão central de destaque.
- Busca de receitas com tela de "resultado não encontrado".
- Detalhes de receita com favoritar/desfavoritar.
- Livro de receitas e receitas publicadas no perfil.
- Formulário de publicação com ingredientes e tags dinâmicos (adicionar/remover).
- Imagens via URL (Unsplash/Pravatar), fáceis de trocar por assets locais.

## Próximos passos sugeridos

- Substituir `RecipeService` por chamadas HTTP reais.
- Adicionar persistência local (ex: `shared_preferences` ou `sqflite`).
- Adicionar validação de formulário mais robusta na tela de publicação.
- Trocar imagens de rede por assets locais em `assets/images/`.

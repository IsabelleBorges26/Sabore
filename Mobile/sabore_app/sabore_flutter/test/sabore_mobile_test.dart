import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sabore_flutter/models/sabore_models.dart';
import 'package:sabore_flutter/screens/auth_screens.dart';
import 'package:sabore_flutter/screens/landing_screen.dart';
import 'package:sabore_flutter/theme/app_theme.dart';

void main() {
  group('Saboré Mobile — Modelos e Contratos Reais da API', () {
    test('Recipe.fromJson mapeia chaves em Inglês (formatRecipe do Back-End) e Português', () {
      final jsonFromBackend = {
        'id': 42,
        'title': 'Risoto de Camarão Trufado',
        'description': 'Cremoso e aromático #Risoto #FrutosDoMar',
        'difficulty': 'Médio',
        'time': '35 min',
        'public': true,
        'criadaPorIA': true,
        'authorId': 7,
        'author': 'Chef Isabelle',
        'authorPlan': 'PRO',
        'authorFrame': 'moldura-natal-2026',
        'likes': 18,
        'comentarios': 5,
        'compartilhamentos': 3,
        'avaliacoes': {'media': 4.8, 'total': 12},
        'ingredients': ['300g de arroz arbóreo', '400g de camarão rosa'],
        'steps': ['Refogue o alho no azeite.', 'Adicione o arroz e o vinho branco.'],
      };

      final recipe = Recipe.fromJson(jsonFromBackend);
      expect(recipe.id, 42);
      expect(recipe.titulo, 'Risoto de Camarão Trufado');
      expect(recipe.tempoPreparo, 35);
      expect(recipe.publica, isTrue);
      expect(recipe.criadaPorIA, isTrue);
      expect(recipe.autorId, 7);
      expect(recipe.autorNome, 'Chef Isabelle');
      expect(recipe.autorIsPro, isTrue);
      expect(recipe.mediaAvaliacoes, 4.8);
      expect(recipe.totalAvaliacoes, 12);
      expect(recipe.totalComentarios, 5);
      expect(recipe.totalFavoritos, 18);
      expect(recipe.ingredientes.length, 2);
      expect(recipe.steps.length, 2);
      expect(recipe.hashtags, contains('#Risoto'));
    });

    test('FridgeIngredient.fromDynamic aceita String pura da API /ingredientes-disponiveis/listar', () {
      final ing = FridgeIngredient.fromDynamic('Queijo Parmesão', 1);
      expect(ing.nome, 'Queijo Parmesão');
      expect(ing.id, 1);
    });

    test('IaConsumption.fromJson mapeia créditos restantes de Chat, Foto e Vídeo', () {
      final cons = IaConsumption.fromJson({
        'plano': 'FREE',
        'ilimitado': false,
        'restantesChat': 4,
        'limiteMensalChat': 5,
        'totalChatMes': 1,
        'restantesImagem': 1,
        'limiteMensalImagem': 2,
        'totalImagemMes': 1,
        'restantesVideo': 2,
        'limiteMensalVideo': 2,
        'totalVideoMes': 0,
      });
      expect(cons.isPro, isFalse);
      expect(cons.chatRestantes, 4);
      expect(cons.fotoRestantes, 1);
      expect(cons.videoRestantes, 2);
    });
  });

  testWidgets('Renderiza LandingScreen pública e AuthScreen com login Google e Facebook',
      (WidgetTester tester) async {
    bool navigatedToLogin = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: LandingScreen(
          onNavigateToLogin: () => navigatedToLogin = true,
          onNavigateToRegister: () {},
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Saboré'), findsWidgets);
    expect(find.text('Entrar'), findsWidgets);

    await tester.tap(find.text('Entrar').first);
    await tester.pump();
    expect(navigatedToLogin, isTrue);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: AuthScreen(
          onBackToLanding: () {},
          onAuthenticated: () {},
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Entrar na Minha Cozinha'), findsOneWidget);
    expect(find.text('Google'), findsOneWidget);
    expect(find.text('Facebook'), findsOneWidget);
  });
}

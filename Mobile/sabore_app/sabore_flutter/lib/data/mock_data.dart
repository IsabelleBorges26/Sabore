import '../models/app_user.dart';
import '../models/recipe.dart';

/// Fonte de dados fictícia. Em uma futura integração com backend,
/// basta substituir estas listas por chamadas a um RecipeService real,
/// sem alterar as telas.
class MockData {
  MockData._();

  static const AppUser currentUser = AppUser(
    name: 'Gabriela Leal',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    bio: 'Apaixonada por doces e receitas rápidas',
  );

  static final List<Recipe> recipes = [
    Recipe(
      id: '1',
      name: 'Panqueca Americana',
      imageUrl:
          'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Café da manhã',
      timeInMinutes: 20,
      servings: 2,
      rating: 4.8,
      description:
          'Panquecas fofinhas e douradas, perfeitas para um café da manhã especial.',
      ingredients: [
        '2 xícaras de farinha de trigo',
        '2 ovos',
        '1 xícara de leite',
        '2 colheres de açúcar',
        '1 colher de fermento em pó',
        '1 pitada de sal',
      ],
      utensils: ['Frigideira antiaderente', 'Batedor de arame', 'Concha'],
      tags: ['Doce', 'Rápido', 'Café da manhã'],
    ),
    Recipe(
      id: '2',
      name: 'Panqueca Brasileira Salgada',
      imageUrl:
          'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Almoço',
      timeInMinutes: 35,
      servings: 4,
      rating: 4.6,
      description:
          'A clássica panqueca salgada recheada, envolta em um molho de tomate caseiro.',
      ingredients: [
        '2 xícaras de farinha de trigo',
        '2 ovos',
        '1 xícara de leite',
        '300g de frango desfiado',
        '1 lata de molho de tomate',
        'Sal e temperos a gosto',
      ],
      utensils: ['Frigideira', 'Refratário', 'Liquidificador'],
      tags: ['Salgado', 'Almoço', 'Família'],
    ),
    Recipe(
      id: '3',
      name: 'Pudim de Microondas',
      imageUrl:
          'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Sobremesa',
      timeInMinutes: 25,
      servings: 6,
      rating: 4.9,
      description:
          'Um pudim cremoso feito em minutos no microondas, sem precisar de forno.',
      ingredients: [
        '1 lata de leite condensado',
        '2 latas de leite (medida na lata)',
        '3 ovos',
        '1 xícara de açúcar (para a calda)',
        '1/2 xícara de água (para a calda)',
      ],
      utensils: ['Forma de pudim', 'Panela', 'Liquidificador'],
      tags: ['Doce', 'Sobremesa', 'Rápido'],
    ),
    Recipe(
      id: '4',
      name: 'Torradas com Ba...',
      imageUrl:
          'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Café da manhã',
      timeInMinutes: 10,
      servings: 1,
      rating: 4.3,
      description: 'Torradas crocantes cobertas com fatias de banana e mel.',
      ingredients: ['2 fatias de pão integral', '1 banana', 'Mel a gosto'],
      utensils: ['Torradeira', 'Faca'],
      tags: ['Rápido', 'Café da manhã'],
    ),
    Recipe(
      id: '5',
      name: 'Salada com Frut...',
      imageUrl:
          'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Saudável',
      timeInMinutes: 15,
      servings: 2,
      rating: 4.5,
      description: 'Uma salada leve e refrescante com frutas da estação.',
      ingredients: ['Alface', 'Morango', 'Manga', 'Nozes', 'Mel'],
      utensils: ['Tigela grande', 'Faca'],
      tags: ['Saudável', 'Leve'],
    ),
    Recipe(
      id: '6',
      name: 'Espaguete',
      imageUrl:
          'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Almoço',
      timeInMinutes: 30,
      servings: 4,
      rating: 4.7,
      description: 'Espaguete ao molho de tomate fresco com manjericão.',
      ingredients: ['500g de espaguete', 'Molho de tomate', 'Manjericão'],
      utensils: ['Panela grande', 'Escumadeira'],
      tags: ['Massa', 'Almoço'],
    ),
    Recipe(
      id: '7',
      name: 'Hambúrguer de...',
      imageUrl:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Almoço',
      timeInMinutes: 25,
      servings: 2,
      rating: 4.4,
      description: 'Hambúrguer artesanal suculento com queijo derretido.',
      ingredients: ['2 pães de hambúrguer', '2 discos de carne', 'Queijo'],
      utensils: ['Chapa ou frigideira', 'Espátula'],
      tags: ['Salgado', 'Rápido'],
    ),
    Recipe(
      id: '8',
      name: 'Macarrão Salgada',
      imageUrl:
          'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Almoço',
      timeInMinutes: 30,
      servings: 4,
      rating: 4.5,
      description: 'Macarrão salgado com molho encorpado e queijo ralado.',
      ingredients: ['Macarrão', 'Molho de tomate', 'Queijo ralado'],
      utensils: ['Panela', 'Ralador'],
      tags: ['Massa', 'Família'],
    ),
  ];

  static List<Recipe> get popular => recipes.take(4).toList();
  static List<Recipe> get recent => recipes.reversed.take(4).toList();
  static List<Recipe> get desserts =>
      recipes.where((r) => r.category == 'Sobremesa').toList();
  static List<Recipe> get myBook => recipes.take(3).toList();
  static List<Recipe> get published => recipes.skip(3).take(4).toList();

  static List<Recipe> search(String query) {
    if (query.trim().isEmpty) return [];
    final q = query.toLowerCase();
    return recipes.where((r) => r.name.toLowerCase().contains(q)).toList();
  }
}

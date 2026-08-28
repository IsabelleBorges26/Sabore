import '../models/app_user.dart';
import '../models/recipe.dart';

class MockData {
  MockData._();

  static const AppUser currentUser = AppUser(
    name: 'Gabriela Leal',
    avatarUrl:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeKWpHr4YIHk_W_TUGO4DiVMsiltZL3xfgI-hMH9Rj1A&s=10',
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
          'https://images.unsplash.com/photo-1709880194932-8f33d90bdae8?q=80&w=737&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
      name: 'Torradas com Banana',
      imageUrl:
          'https://plus.unsplash.com/premium_photo-1695207505573-d5b4c55f4dc4?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Café da manhã',
      timeInMinutes: 10,
      servings: 1,
      rating: 4.3,
      description: 'Torradas crocantes cobertas com fatias de banana e mel.',
      ingredients: [
        '2 fatias de pão integral',
        '1 banana',
        '1 colher de doce de leite',
        'Mel a gosto'
      ],
      utensils: ['Torradeira', 'Faca'],
      tags: ['Rápido', 'Café da manhã'],
    ),
    Recipe(
      id: '5',
      name: 'Salada de frutas',
      imageUrl:
          'https://images.unsplash.com/photo-1613082487279-1e16f1e81505?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Saudável',
      timeInMinutes: 15,
      servings: 2,
      rating: 4.5,
      description: 'Uma salada leve e refrescante com frutas deliciosas.',
      ingredients: ['Banana', 'Morango', 'Manga', 'Nozes', 'Mel'],
      utensils: ['Tigela grande', 'Faca'],
      tags: ['Saudável', 'Leve'],
    ),
    Recipe(
      id: '6',
      name: 'Espaguete ao molho sugo',
      imageUrl:
          'https://plus.unsplash.com/premium_photo-1664472682525-0c0b50534850?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
      name: 'Hambúrguer de carne',
      imageUrl:
          'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
      name: 'Espagute ao molho branco',
      imageUrl:
          'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      authorName: 'Gabriela Leal',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=32',
      category: 'Almoço',
      timeInMinutes: 30,
      servings: 4,
      rating: 4.5,
      description: 'Espaguete com molho branco e queijo ralado.',
      ingredients: ['Macarrão', 'Molho branco', 'Queijo ralado'],
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

/// Representa uma receita dentro do app.
/// Estrutura preparada para futura integração com um backend real
/// (ex: fromJson / toJson podem ser adicionados sem alterar as telas).
class Recipe {
  final String id;
  final String name;
  final String imageUrl;
  final String authorName;
  final String authorAvatarUrl;
  final String category;
  final int timeInMinutes;
  final int servings;
  final double rating;
  final String description;
  final List<String> ingredients;
  final List<String> utensils;
  final List<String> tags;
  bool isFavorite;

  Recipe({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.authorName,
    required this.authorAvatarUrl,
    required this.category,
    required this.timeInMinutes,
    required this.servings,
    required this.rating,
    required this.description,
    required this.ingredients,
    required this.utensils,
    required this.tags,
    this.isFavorite = false,
  });

  Recipe copyWith({bool? isFavorite}) {
    return Recipe(
      id: id,
      name: name,
      imageUrl: imageUrl,
      authorName: authorName,
      authorAvatarUrl: authorAvatarUrl,
      category: category,
      timeInMinutes: timeInMinutes,
      servings: servings,
      rating: rating,
      description: description,
      ingredients: ingredients,
      utensils: utensils,
      tags: tags,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }
}

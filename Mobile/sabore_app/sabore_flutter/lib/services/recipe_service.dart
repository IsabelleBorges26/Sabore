import '../data/mock_data.dart';
import '../models/recipe.dart';

class RecipeService {
  RecipeService._internal();
  static final RecipeService instance = RecipeService._internal();

  List<Recipe> get all => MockData.recipes;

  void toggleFavorite(Recipe recipe) {
    recipe.isFavorite = !recipe.isFavorite;
  }

  List<Recipe> get favorites =>
      MockData.recipes.where((r) => r.isFavorite).toList();

  List<Recipe> search(String query) => MockData.search(query);

  void publish(Recipe recipe) {
    MockData.recipes.insert(0, recipe);
  }
}

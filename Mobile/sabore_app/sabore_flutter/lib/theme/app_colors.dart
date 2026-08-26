import 'package:flutter/material.dart';

/// Paleta de cores do Saboré, extraída visualmente do protótipo.
/// Centralizar aqui facilita a manutenção e evita "cores mágicas"
/// espalhadas pelas telas.
class AppColors {
  AppColors._();

  // Verde-escuro profundo (Login, Perfil, Não encontrado)
  static const Color darkGreen = Color(0xFF16332B);
  static const Color darkGreenSurface = Color(0xFF1E3F35);
  static const Color darkGreenField = Color(0xFF244A3E);

  // Rosa queimado / rosé (Home, Busca, Publicar)
  static const Color rose = Color(0xFFD98A82);
  static const Color roseDark = Color(0xFFC97A72);
  static const Color roseSurface = Color(0xFFE29B93);

  // Amarelo claro / dourado (Detalhes da receita)
  static const Color gold = Color(0xFFDDA43B);
  static const Color goldDark = Color(0xFFCB9430);
  static const Color goldSurface = Color(0xFFE6B04F);

  // Neutros / superfícies claras
  static const Color cream = Color(0xFFFBF3E7);
  static const Color offWhite = Color(0xFFF7F1E8);
  static const Color card = Color(0xFFFFFFFF);

  // Textos
  static const Color textLight = Color(0xFFFDF8F0);
  static const Color textLightMuted = Color(0xCCFDF8F0);
  static const Color textDark = Color(0xFF2B2620);
  static const Color textMuted = Color(0xFF8A8378);

  // Destaques
  static const Color accentGreen = Color(0xFF2F6B52);
  static const Color favoriteRed = Color(0xFFE0645A);
  static const Color chipBackground = Color(0xFFF3E3C9);

  static const Color divider = Color(0x1AFFFFFF);
  static const Color shadow = Color(0x1A000000);
}

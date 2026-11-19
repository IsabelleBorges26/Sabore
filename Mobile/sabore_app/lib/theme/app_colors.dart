import 'package:flutter/material.dart';

/// Paleta oficial idêntica ao Saboré Web (`Front-End/assets/css/global.css`)
class AppColors {
  AppColors._();

  // Fundos principais (Verde Esmeralda Profundo / Obsidiana)
  static const Color dark = Color(0xFF1B2B27);       // --dark
  static const Color darkDeep = Color(0xFF121F1C);   // --dark-deep
  static const Color darkCard = Color(0xFF213530);   // --dark-card
  static const Color darkCardAlt = Color(0xFF1E322D);
  static const Color surface = Color(0xFF263D37);

  // Cores de destaque (Coral / Terracota Suave & Champagne)
  static const Color accent = Color(0xFFE0857A);      // --accent
  static const Color accentHover = Color(0xFFD4726A); // --accent-hover
  static const Color secondary = Color(0xFFF0D5B6);   // --secondary (Champagne)
  static const Color light = Color(0xFFF2F4F3);       // --light

  // Textos
  static const Color textPrimary = Color(0xFFF2F4F3);
  static const Color textSecondary = Color(0xD9F0D5B6);
  static const Color textMuted = Color(0x99F2F4F3);

  // Status Semânticos
  static const Color success = Color(0xFF27C93F); // --success
  static const Color warning = Color(0xFFFFBD2E); // --warning
  static const Color danger = Color(0xFFFF5F56);  // --danger
  static const Color info = Color(0xFF58A6FF);

  // Saboré PRO (Ouro Metálico)
  static const Color proGold = Color(0xFFFFD700);
  static const Color proGoldDark = Color(0xFFFFA500);
  static const Color proAmber = Color(0xFFFFB800);

  // Bordas & Glassmorphism
  static const Color glassBorder = Color(0x1FF0D5B6);      // rgba(240, 213, 182, 0.12)
  static const Color glassBorderHover = Color(0x47F0D5B6); // rgba(240, 213, 182, 0.28)
  static const Color accentBorder = Color(0x4DE0857A);     // rgba(224, 133, 122, 0.30)
  static const Color proBorder = Color(0x59FFD700);        // rgba(255, 215, 0, 0.35)

  // Gradientes oficiais
  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFE0857A), Color(0xFFC96A5E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient proGoldGradient = LinearGradient(
    colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkBackgroundGradient = LinearGradient(
    colors: [Color(0xFF121F1C), Color(0xFF1B2B27), Color(0xFF152420)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF233833), Color(0xFF1B2B27)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient proBannerGradient = LinearGradient(
    colors: [Color(0xFF2D2612), Color(0xFF1F2E29)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Molduras de Eventos Especiais (.moldura-natal-2026 / .moldura-reveillon-2027)
  static const LinearGradient frameNatalGradient = LinearGradient(
    colors: [Color(0xFFD62828), Color(0xFFFFD700), Color(0xFF2A9D8F)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient frameReveillonGradient = LinearGradient(
    colors: [Color(0xFFFFD700), Color(0xFFFFF3B0), Color(0xFFE09F3E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

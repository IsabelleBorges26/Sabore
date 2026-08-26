import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_text_styles.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.offWhite,
      fontFamily: AppTextStyles.body.fontFamily,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.accentGreen,
        primary: AppColors.accentGreen,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      splashFactory: NoSplash.splashFactory,
    );
  }
}

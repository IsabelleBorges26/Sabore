import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Tipografia oficial idêntica ao Saboré Web:
/// Playfair Display (Títulos), DM Sans (Corpo e UI), DM Mono (Métricas/Contadores)
class AppTextStyles {
  AppTextStyles._();

  static TextStyle get headingXL => GoogleFonts.playfairDisplay(
        fontSize: 30,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        height: 1.2,
      );

  static TextStyle get headingLg => GoogleFonts.playfairDisplay(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        height: 1.25,
      );

  static TextStyle get headingMd => GoogleFonts.playfairDisplay(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        height: 1.3,
      );

  static TextStyle get headingSm => GoogleFonts.playfairDisplay(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      );

  static TextStyle get subtitle => GoogleFonts.dmSans(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: AppColors.secondary,
      );

  static TextStyle get bodyLg => GoogleFonts.dmSans(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.5,
      );

  static TextStyle get body => GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.45,
      );

  static TextStyle get bodyMuted => GoogleFonts.dmSans(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: AppColors.textMuted,
        height: 1.4,
      );

  static TextStyle get label => GoogleFonts.dmSans(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.secondary,
        letterSpacing: 0.4,
      );

  static TextStyle get button => GoogleFonts.dmSans(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.light,
        letterSpacing: 0.2,
      );

  static TextStyle get mono => GoogleFonts.dmMono(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: AppColors.secondary,
      );

  static TextStyle get monoLg => GoogleFonts.dmMono(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      );
}

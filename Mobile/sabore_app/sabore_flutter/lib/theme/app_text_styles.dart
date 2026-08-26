import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Hierarquia tipográfica do app. Usa Poppins para se aproximar da
/// fonte arredondada e amigável observada no protótipo.
class AppTextStyles {
  AppTextStyles._();

  static TextStyle get logo => GoogleFonts.poppins(
        fontSize: 26,
        fontWeight: FontWeight.w600,
        fontStyle: FontStyle.italic,
        color: AppColors.textLight,
      );

  static TextStyle get h1 => GoogleFonts.poppins(
        fontSize: 22,
        fontWeight: FontWeight.w700,
      );

  static TextStyle get h2 => GoogleFonts.poppins(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get h3 => GoogleFonts.poppins(
        fontSize: 15,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get body => GoogleFonts.poppins(
        fontSize: 14,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get bodySmall => GoogleFonts.poppins(
        fontSize: 12,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get caption => GoogleFonts.poppins(
        fontSize: 11,
        fontWeight: FontWeight.w400,
        color: AppColors.textMuted,
      );

  static TextStyle get button => GoogleFonts.poppins(
        fontSize: 15,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get link => GoogleFonts.poppins(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        decoration: TextDecoration.underline,
      );
}

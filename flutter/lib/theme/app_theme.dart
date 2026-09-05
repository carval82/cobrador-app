import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const forest = Color(0xFF0B6B4F);
  static const forestDark = Color(0xFF084D39);
  static const mint = Color(0xFF1FA971);
  static const cream = Color(0xFFF3F6F4);
  static const paper = Color(0xFFFFFFFF);
  static const ink = Color(0xFF14241D);
  static const muted = Color(0xFF5B6B64);
  static const line = Color(0xFFE2EAE5);
  static const amber = Color(0xFFE09B2D);
  static const amberSoft = Color(0xFFFFF4DC);
  static const rose = Color(0xFFD64545);
  static const roseSoft = Color(0xFFFFE8E6);
  static const sky = Color(0xFF2B6CB0);
  static const skySoft = Color(0xFFE8F1FB);
  static const violet = Color(0xFF6D4AB8);
}

ThemeData buildAppTheme() {
  final text = GoogleFonts.plusJakartaSansTextTheme().apply(
    bodyColor: AppColors.ink,
    displayColor: AppColors.ink,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.forest,
      brightness: Brightness.light,
      primary: AppColors.forest,
      onPrimary: Colors.white,
      surface: AppColors.paper,
    ),
    scaffoldBackgroundColor: AppColors.cream,
    textTheme: text,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.cream,
      foregroundColor: AppColors.ink,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.plusJakartaSans(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.paper,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.forest, width: 1.6),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.forest,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(54),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: GoogleFonts.plusJakartaSans(
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
    cardTheme: CardTheme(
      color: AppColors.paper,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.line),
      ),
    ),
  );
}

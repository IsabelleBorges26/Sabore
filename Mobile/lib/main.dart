import 'package:flutter/material.dart';
import 'screens/home.dart';

void main() {
  runApp(const SaboreApp());
}

class SaboreApp extends StatelessWidget {
  const SaboreApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Saboré',
      theme: ThemeData(scaffoldBackgroundColor: const Color(0xFFF0E1C6)),
      home: const HomePage(),
    );
  }
}

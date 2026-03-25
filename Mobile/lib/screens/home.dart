import 'package:flutter/material.dart';
import '../models/receita_model.dart';
import 'explorar.dart';
import 'geladeira.dart';
import 'perfil.dart';
import 'receitas.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int paginaAtual = 0;

  @override
  Widget build(BuildContext context) {
    final telas = [
      const TelaHome(),
      const TelaExplorar(),
      const TelaGeladeira(),
      const TelaPerfil(),
    ];

    return Scaffold(
      body: telas[paginaAtual],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: paginaAtual,
        selectedItemColor: const Color(0xFFE86C73),
        onTap: (index) {
          setState(() => paginaAtual = index);
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home"),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: "Explorar"),
          BottomNavigationBarItem(
            icon: Icon(Icons.kitchen),
            label: "Geladeira",
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: "Perfil"),
        ],
      ),
    );
  }
}

class TelaHome extends StatefulWidget {
  const TelaHome({super.key});

  @override
  State<TelaHome> createState() => _TelaHomeState();
}

class _TelaHomeState extends State<TelaHome> {
  final List<Receita> receitas = [
    const Receita(
      titulo: "Lasanha",
      imagem: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
      descricao: "Lasanha deliciosa com queijo",
    ),
    const Receita(
      titulo: "Hambúrguer",
      imagem: "https://images.unsplash.com/photo-1550547660-d9450f859349",
      descricao: "Hambúrguer artesanal",
    ),
    const Receita(
      titulo: "Salada",
      imagem: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
      descricao: "Salada saudável",
    ),
  ];

  List<Receita> filtradas = [];

  @override
  void initState() {
    super.initState();
    filtradas = receitas;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // LOGO
            const Text(
              "Saboré",
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Color(0xFFE86C73),
              ),
            ),

            const SizedBox(height: 15),

            // BUSCA REAL
            TextField(
              onChanged: (texto) {
                setState(() {
                  filtradas = receitas
                      .where(
                        (r) => r.titulo.toLowerCase().contains(
                          texto.toLowerCase(),
                        ),
                      )
                      .toList();
                });
              },
              decoration: InputDecoration(
                hintText: "Buscar receita...",
                filled: true,
                fillColor: Colors.white,
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              "Receitas",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            // LISTA REAL
            ...filtradas.map((receita) {
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TelaReceita(
                        titulo: receita.titulo,
                        imagem: receita.imagem,
                        descricao: receita.descricao,
                      ),
                    ),
                  );
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 15),
                  height: 150,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    image: DecorationImage(
                      image: NetworkImage(receita.imagem),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Container(
                    alignment: Alignment.bottomLeft,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      color: Colors.black.withValues(alpha: 0.3),
                    ),
                    child: Text(
                      receita.titulo,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

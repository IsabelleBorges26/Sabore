import 'package:flutter/material.dart';

class TelaReceita extends StatelessWidget {
  final String titulo;
  final String imagem;
  final String descricao;

  const TelaReceita({
    super.key,
    required this.titulo,
    required this.imagem,
    required this.descricao,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(titulo)),
      body: ListView(
        children: [
          Image.network(imagem),
          Padding(padding: const EdgeInsets.all(16), child: Text(descricao)),
        ],
      ),
    );
  }
}

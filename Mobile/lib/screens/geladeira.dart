import 'package:flutter/material.dart';
import 'receitas.dart';

class TelaGeladeira extends StatefulWidget {
  const TelaGeladeira({super.key});

  @override
  State<TelaGeladeira> createState() => _TelaGeladeiraState();
}

class _TelaGeladeiraState extends State<TelaGeladeira> {
  final Map<String, bool> ingredientes = {
    "Ovo": false,
    "Tomate": false,
    "Queijo": false,
    "Frango": false,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Geladeira")),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              children: ingredientes.keys.map((item) {
                return CheckboxListTile(
                  title: Text(item),
                  value: ingredientes[item],
                  onChanged: (value) {
                    setState(() {
                      ingredientes[item] = value!;
                    });
                  },
                );
              }).toList(),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              final selecionados = ingredientes.entries
                  .where((e) => e.value)
                  .map((e) => e.key)
                  .toList();

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TelaReceita(
                    titulo: "Receita com ${selecionados.join(", ")}",
                    imagem:
                        "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
                    descricao: "Receita gerada automaticamente",
                  ),
                ),
              );
            },
            child: const Text("Gerar Receita"),
          ),
        ],
      ),
    );
  }
}

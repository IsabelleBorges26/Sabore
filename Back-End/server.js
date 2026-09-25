require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
// Imagens enviadas pela IA por foto podem ultrapassar o limite padrão do Express.
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Servir arquivos estáticos do Front-End
app.use(express.static(path.join(__dirname, "..", "Front-End")));

const usuariosRoutes = require("./src/routes/usuarios.routes");
const receitasRoutes = require("./src/routes/receitas.routes");
const ingredientesRoutes = require("./src/routes/ingredientes.routes");
const receitaIngredienteRoutes = require("./src/routes/receitaIngrediente.routres");
const receitaCategoriaRoutes = require("./src/routes/receitaCategoria.routes");
const favoritosRoutes = require("./src/routes/favoritos.routes");
const avaliacoesRoutes = require("./src/routes/avaliacoes.routes");
const ingredienteDisponivelRoutes = require("./src/routes/ingredienteDisponivel.routes");
const geracaoIARoutes = require("./src/routes/geracaoIA.routes");
const importacaoRoutes = require("./src/routes/importacao.routes");
const compartilhamentoRoutes = require("./src/routes/compartilhamento.routes");
const livrosRoutes = require("./src/routes/livros.routes");
const planosRoutes = require("./src/routes/planos.routes");
const bibliotecasRoutes = require("./src/routes/bibliotecas.routes");
const socialRoutes = require("./src/routes/social.routes");
const estatisticasRoutes = require("./src/routes/estatisticas.routes");

app.use("/usuarios", usuariosRoutes);
app.use("/receitas", receitasRoutes);
app.use("/ingredientes", ingredientesRoutes);
app.use("/receita-ingredientes", receitaIngredienteRoutes);
app.use("/receita-categorias", receitaCategoriaRoutes);
app.use("/favoritos", favoritosRoutes);
app.use("/avaliacoes", avaliacoesRoutes);
app.use("/ingredientes-disponiveis", ingredienteDisponivelRoutes);
app.use("/ia", geracaoIARoutes);
app.use("/importacao", importacaoRoutes);
app.use("/compartilhamento", compartilhamentoRoutes);
app.use("/livros", livrosRoutes);
app.use("/planos", planosRoutes);
app.use("/bibliotecas", bibliotecasRoutes);
app.use("/social", socialRoutes);
app.use("/estatisticas", estatisticasRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "Front-End", "index.html"));
});

const porta = process.env.PORT_APP || 3000;
app.listen(porta, () => {
    console.log(`Online na porta ${porta}`);
});

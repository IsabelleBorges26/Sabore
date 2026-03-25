require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

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

const porta = process.env.PORT_APP || 3000;

app.listen(porta, () => {
    console.log(`Online na porta ${porta}`);
});
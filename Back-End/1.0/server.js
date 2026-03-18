require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const usuariosRoutes = require("./src/routes/usuarios.routes");
const receitasRoutes = require("./src/routes/receitas.routes");
const ingredientesRoutes = require("./src/routes/ingredientes.routes");
const planosRoutes = require("./src/routes/planos.routes");
const bibliotecasRoutes = require("./src/routes/bibliotecas.routes");
const compartilhamentoRoutes = require("./src/routes/compartilhamento.routes");

app.use("/usuarios", usuariosRoutes);
app.use("/receitas", receitasRoutes);
app.use("/ingredientes", ingredientesRoutes);
app.use("/ingredientes", planosRoutes);
app.use("/ingredientes", bibliotecasRoutes);
app.use("/ingredientes", compartilhamentoRoutes);

const porta = process.env.PORT_APP || 3000;

app.listen(porta, () => {
    console.log(`Online na porta ${porta}`);
});
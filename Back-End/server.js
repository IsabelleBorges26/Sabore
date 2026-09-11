const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const prisma = require("./src/data/prisma");

const app = express();

// a IA por foto envia a imagem em base64; o limite padrão do Express é pequeno.
app.use(express.json({ limit: "10mb" }));
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
const livrosRoutes = require("./src/routes/livros.routes");
const planosRoutes = require("./src/routes/planos.routes");
const bibliotecasRoutes = require("./src/routes/bibliotecas.routes");

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/health/db", async (_req, res) => {
    try {
        const usuarios = await prisma.usuario.count();
        res.status(200).json({ status: "ok", usuarios });
    } catch (error) {
        console.error("Erro na conexão com o banco:", error.message);
        res.status(503).json({
            status: "error",
            erro: "Não foi possível conectar ao banco de dados.",
            ...(process.env.NODE_ENV !== "production" ? { detalhe: error.message } : {})
        });
    }
});

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

const porta = process.env.PORT_APP || 3000;
app.listen(porta, () => {
    console.log(`Backend online na porta ${porta}`);
});

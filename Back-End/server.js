const path = require("path");
// Carrega explicitamente o .env localizado em Back-End/.env ou na raiz
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cors());

const frontEndPath = path.resolve(__dirname, "..", "Front-End");
app.use(express.static(frontEndPath));
app.use("/Front-End", express.static(frontEndPath));
app.get("/publicacao/:id", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(frontEndPath, "publicacao", "index.html"));
});

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
const contatoRoutes = require("./src/routes/contato.routes");

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
app.use("/contato", contatoRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(frontEndPath, "index.html"));
});

app.get("/ranking", (req, res) => {
    res.sendFile(path.join(frontEndPath, "Dashboard", "ranking", "index.html"));
});
app.get("/admin", (req, res) => {
    res.sendFile(path.join(frontEndPath, "Dashboard", "admin", "index.html"));
});

const porta = process.env.PORT_APP || 3000;
if (!process.env.VERCEL) {
    app.listen(porta, () => {
        console.log(`Online na porta ${porta}`);

        // Agendamento periódico de verificação de fechamento mensal automático (a cada 12 horas)
        try {
            const { getSaoPauloDate, getMesReferencia, executarFechamentoMensal } = require("./src/services/engajamento.service");
            const checarFechamentoAutomatico = async () => {
                const sp = getSaoPauloDate();
                // Se for o 1º dia do mês (ou 2º), verifica se o mês anterior já foi fechado
                if (sp.getDate() <= 2) {
                    let mesAnteriorNum = sp.getMonth(); // 0 a 11, onde 0 é janeiro
                    let anoAnterior = sp.getFullYear();
                    if (mesAnteriorNum === 0) {
                        mesAnteriorNum = 12;
                        anoAnterior -= 1;
                    }
                    const mesAnteriorRef = `${anoAnterior}-${String(mesAnteriorNum).padStart(2, "0")}`;
                    try {
                        const resFechamento = await executarFechamentoMensal(mesAnteriorRef);
                        if (!resFechamento.jaExecutado) {
                            console.log(`[Fechamento Automático] Mês ${mesAnteriorRef} fechado com sucesso.`);
                        }
                    } catch (e) {
                        console.error("[Fechamento Automático] Erro:", e.message);
                    }
                }
            };
            setInterval(checarFechamentoAutomatico, 12 * 60 * 60 * 1000);
            checarFechamentoAutomatico();
        } catch (jobErr) {
            console.warn("[Cron Fechamento] Agendador local não iniciado:", jobErr.message);
        }
    });
}

module.exports = app;

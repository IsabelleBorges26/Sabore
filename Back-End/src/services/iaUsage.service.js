const prisma = require("../data/prisma");
const { getMesReferencia, getSemanaChave, getSaoPauloDate } = require("./engajamento.service");

// Limites configuráveis de utilização de IA
const LIMITES_IA = {
    FREE: {
        limiteMensalChat: 5,
        permiteImagem: false,
        permiteVideo: false
    },
    PRO: {
        limiteSemanalTotal: 10,
        permiteImagem: true,
        permiteVideo: true
    }
};

/**
 * Calcula quando o limite irá renovar
 */
function calcularProximaRenovacao(plano) {
    const sp = getSaoPauloDate();
    if (plano === "PRO") {
        // Renova na próxima segunda-feira às 00:00 (America/Sao_Paulo)
        const diaSemana = sp.getDay(); // 0 = domingo, 1 = segunda
        const diasAteSegunda = ((8 - diaSemana) % 7) || 7;
        const prox = new Date(sp.getTime() + diasAteSegunda * 24 * 60 * 60 * 1000);
        prox.setHours(0, 0, 0, 0);
        return {
            tipo: "semanal",
            data: prox.toISOString(),
            texto: `na próxima segunda-feira (${prox.toLocaleDateString("pt-BR")})`
        };
    } else {
        // FREE renova no dia 1º do próximo mês às 00:00 (America/Sao_Paulo)
        const prox = new Date(sp.getFullYear(), sp.getMonth() + 1, 1, 0, 0, 0, 0);
        return {
            tipo: "mensal",
            data: prox.toISOString(),
            texto: `no 1º dia do próximo mês (${prox.toLocaleDateString("pt-BR")})`
        };
    }
}

/**
 * Consulta o consumo do usuário no período atual
 */
async function obterConsumoUsuario(usuarioId, planoUsuario = null) {
    if (!usuarioId) return null;

    let plano = planoUsuario;
    if (!plano) {
        const u = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { plano: true }
        });
        plano = u?.plano || "FREE";
    }

    const mesReferencia = getMesReferencia();
    const semanaChave = getSemanaChave();

    if (plano === "PRO") {
        const totalUsosSemana = await prisma.usoIA.count({
            where: {
                usuarioId,
                semanaChave
            }
        });

        const limite = LIMITES_IA.PRO.limiteSemanalTotal;
        const restantes = Math.max(0, limite - totalUsosSemana);
        const podeUsar = restantes > 0;
        const renovacao = calcularProximaRenovacao("PRO");

        return {
            plano: "PRO",
            periodo: "semanal",
            chavePeriodo: semanaChave,
            limiteTotal: limite,
            usados: totalUsosSemana,
            restantes,
            podeUsar,
            modalidadesPermitidas: ["CHAT", "IMAGEM", "VIDEO"],
            proximaRenovacao: renovacao
        };
    } else {
        const totalChatMes = await prisma.usoIA.count({
            where: {
                usuarioId,
                mesReferencia,
                modalidade: "CHAT"
            }
        });

        const limite = LIMITES_IA.FREE.limiteMensalChat;
        const restantes = Math.max(0, limite - totalChatMes);
        const podeUsar = restantes > 0;
        const renovacao = calcularProximaRenovacao("FREE");

        return {
            plano: "FREE",
            periodo: "mensal",
            chavePeriodo: mesReferencia,
            limiteTotal: limite,
            usados: totalChatMes,
            restantes,
            podeUsar,
            modalidadesPermitidas: ["CHAT"],
            proximaRenovacao: renovacao
        };
    }
}

/**
 * Valida se o usuário tem permissão para usar uma modalidade específica
 */
async function validarAcessoIA(usuarioId, modalidade) {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, plano: true }
    });

    if (!usuario) {
        return {
            permitido: false,
            status: 401,
            erro: "Usuário não autenticado."
        };
    }

    const plano = usuario.plano;
    const modalidadeUpper = String(modalidade).toUpperCase();

    // Verificação de modalidade por plano
    if (plano === "FREE") {
        if (modalidadeUpper !== "CHAT") {
            return {
                permitido: false,
                status: 403,
                erro: "Recurso exclusivo do plano Saboré PRO.",
                detalhe: "Usuários do plano FREE têm acesso apenas ao Chat com Chef IA. Participe do ranking mensal para conquistar o plano PRO gratuitamente!",
                requerPro: true
            };
        }
    }

    // Verificação de cota
    const consumo = await obterConsumoUsuario(usuario.id, plano);
    if (!consumo.podeUsar) {
        const periodoNome = plano === "PRO" ? "semanal" : "mensal";
        return {
            permitido: false,
            status: 429,
            erro: `Limite ${periodoNome} de utilização de IA atingido.`,
            detalhe: `Você consumiu suas ${consumo.limiteTotal} utilizações deste período. Suas utilizações serão renovadas ${consumo.proximaRenovacao.texto}.`,
            consumo
        };
    }

    return {
        permitido: true,
        plano,
        consumo
    };
}

/**
 * Registra o consumo de IA apenas após execução bem-sucedida
 */
async function registrarUsoIASucesso(usuarioId, modalidade, plano) {
    if (!usuarioId) return null;
    const mesReferencia = getMesReferencia();
    const semanaChave = getSemanaChave();

    try {
        return await prisma.usoIA.create({
            data: {
                usuarioId,
                modalidade: String(modalidade).toUpperCase(),
                planoNoUso: plano,
                mesReferencia,
                semanaChave
            }
        });
    } catch (err) {
        console.error("[IA Usage] Erro ao registrar uso:", err.message);
        return null;
    }
}

module.exports = {
    LIMITES_IA,
    obterConsumoUsuario,
    validarAcessoIA,
    registrarUsoIASucesso,
    calcularProximaRenovacao
};

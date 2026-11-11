const prisma = require("../data/prisma");
const { withDirectDatabaseFallback } = require("../data/databaseFallback");


function getSaoPauloDate(date = new Date()) {
    const tzString = date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    return new Date(tzString);
}

function getMesReferencia(date = new Date()) {
    const sp = getSaoPauloDate(date);
    const year = sp.getFullYear();
    const month = String(sp.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function getDiaChave(date = new Date()) {
    const sp = getSaoPauloDate(date);
    const year = sp.getFullYear();
    const month = String(sp.getMonth() + 1).padStart(2, "0");
    const day = String(sp.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getSemanaChave(date = new Date()) {
    const sp = getSaoPauloDate(date);
    const temp = new Date(sp.getTime());
    temp.setHours(0, 0, 0, 0);
    temp.setDate(temp.getDate() + 3 - (temp.getDay() + 6) % 7);
    const week1 = new Date(temp.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${temp.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

const PONTOS_CONFIG = {
    RECEITA_VALIDA: 10,
    ACESSO_DIARIO: 2,
    FAVORITO_RECEBIDO: 2,
    AVALIACAO_RECEBIDA: 3,
    COMENTARIO_RECEBIDO: 3,
    PERFIL_COMPLETO: 5,
    SEGUIR_USUARIO: 1
};

const LIMITES_ENGAJAMENTO = {
    MAX_SEGUIR_PONTUADOS_POR_DIA: 20,
    MAX_RECEITAS_PONTUADAS_POR_DIA: 10
};


async function registrarPontos({ usuarioId, tipo, pontos, chaveUnica, descricao, referenciaId, data = new Date() }) {
    if (!usuarioId) return null;
    const finalPontos = pontos !== undefined ? pontos : (PONTOS_CONFIG[tipo] || 0);
    if (finalPontos <= 0) return null;

    const mesReferencia = getMesReferencia(data);

    try {
        const item = await withDirectDatabaseFallback((db) => db.atividadeEngajamento.create({
            data: {
                usuarioId,
                tipo,
                pontos: finalPontos,
                chaveUnica: chaveUnica || null,
                descricao: descricao || null,
                referenciaId: referenciaId || null,
                mesReferencia,
                createdAt: data
            }
        }), "registrar engajamento", { write: true });
        return item;
    } catch (err) {
        if (err.code === "P2002") {
            return null;
        }
        console.error(`[Engajamento] Erro ao registrar pontos (${tipo}) para usuário ${usuarioId}:`, err.message);
        return null;
    }
}


async function registrarAcessoDiario(usuarioId) {
    if (!usuarioId) return null;
    const diaChave = getDiaChave();
    const chaveUnica = `ACESSO_${usuarioId}_${diaChave}`;
    return registrarPontos({
        usuarioId,
        tipo: "ACESSO_DIARIO",
        chaveUnica,
        descricao: `Acesso diário na plataforma em ${diaChave}`
    });
}


async function registrarPublicacaoReceita(usuarioId, receitaId, titulo) {
    if (!usuarioId || !receitaId) return null;
    const chaveUnica = `RECEITA_${receitaId}`;
    return registrarPontos({
        usuarioId,
        tipo: "RECEITA_VALIDA",
        chaveUnica,
        referenciaId: receitaId,
        descricao: `Publicação da receita: ${titulo || "Nova Receita"}`
    });
}


async function registrarFavoritoRecebido(autorId, usuarioAcaoId, receitaId) {
    if (!autorId || !usuarioAcaoId || autorId === usuarioAcaoId) return null;
    const chaveUnica = `FAVORITO_${usuarioAcaoId}_REC_${receitaId}`;
    return registrarPontos({
        usuarioId: autorId,
        tipo: "FAVORITO_RECEBIDO",
        chaveUnica,
        referenciaId: receitaId,
        descricao: `Receita #${receitaId} favoritada por outro usuário`
    });
}


async function registrarAvaliacaoRecebida(autorId, usuarioAcaoId, receitaId) {
    if (!autorId || !usuarioAcaoId || autorId === usuarioAcaoId) return null;
    const chaveUnica = `AVALIACAO_${usuarioAcaoId}_REC_${receitaId}`;
    return registrarPontos({
        usuarioId: autorId,
        tipo: "AVALIACAO_RECEBIDA",
        chaveUnica,
        referenciaId: receitaId,
        descricao: `Receita #${receitaId} avaliada por outro usuário`
    });
}

async function registrarComentarioRecebido(autorId, usuarioAcaoId, receitaId) {
    if (!autorId || !usuarioAcaoId || autorId === usuarioAcaoId) return null;
    const chaveUnica = `COMENTARIO_${usuarioAcaoId}_REC_${receitaId}`;
    return registrarPontos({
        usuarioId: autorId,
        tipo: "COMENTARIO_RECEBIDO",
        chaveUnica,
        referenciaId: receitaId,
        descricao: `Receita #${receitaId} comentada por outro usuário`
    });
}


async function registrarSeguirUsuario(seguidorId, seguidoId) {
    if (!seguidorId || !seguidoId || seguidorId === seguidoId) return null;
    const chaveUnica = `SEGUIR_${seguidorId}_A_${seguidoId}`;
    return registrarPontos({
        usuarioId: seguidorId,
        tipo: "SEGUIR_USUARIO",
        chaveUnica,
        referenciaId: seguidoId,
        descricao: `Seguiu o usuário #${seguidoId}`
    });
}


async function registrarPerfilCompleto(usuarioId) {
    if (!usuarioId) return null;
    const chaveUnica = `PERFIL_COMPLETO_${usuarioId}`;
    return registrarPontos({
        usuarioId,
        tipo: "PERFIL_COMPLETO",
        chaveUnica,
        descricao: "Completou os dados do perfil com foto e informações"
    });
}


async function obterRankingMensal(mesReferenciaParam = null, db = prisma) {
    const mesReferencia = mesReferenciaParam || getMesReferencia();

    const atividades = await db.atividadeEngajamento.findMany({
        where: { mesReferencia },
        include: {
            usuario: {
                select: {
                    id: true,
                    nome: true,
                    foto: true,
                    plano: true
                }
            }
        },
        orderBy: { createdAt: "asc" }
    });

    const mapa = new Map();

    for (const ativ of atividades) {
        const uId = ativ.usuarioId;
        if (!mapa.has(uId)) {
            mapa.set(uId, {
                usuarioId: uId,
                nome: ativ.usuario.nome,
                foto: ativ.usuario.foto,
                plano: ativ.usuario.plano,
                pontos: 0,
                receitasValidas: 0,
                ultimaAtividadeAt: ativ.createdAt,
                primeiraAtividadeAt: ativ.createdAt
            });
        }
        const record = mapa.get(uId);
        record.pontos += ativ.pontos;
        if (ativ.tipo === "RECEITA_VALIDA") {
            record.receitasValidas += 1;
        }
        record.ultimaAtividadeAt = ativ.createdAt;
    }

    const todosUsuarios = await db.usuario.findMany({
        select: { id: true, nome: true, foto: true, plano: true },
        take: 100
    });

    for (const u of todosUsuarios) {
        if (!mapa.has(u.id)) {
            mapa.set(u.id, {
                usuarioId: u.id,
                nome: u.nome,
                foto: u.foto,
                plano: u.plano,
                pontos: 0,
                receitasValidas: 0,
                ultimaAtividadeAt: null,
                primeiraAtividadeAt: null
            });
        }
    }

    const ranking = Array.from(mapa.values());

    ranking.sort((a, b) => {
        if (b.pontos !== a.pontos) {
            return b.pontos - a.pontos;
        }
        if (b.receitasValidas !== a.receitasValidas) {
            return b.receitasValidas - a.receitasValidas;
        }
        if (a.ultimaAtividadeAt && b.ultimaAtividadeAt) {
            return new Date(a.ultimaAtividadeAt).getTime() - new Date(b.ultimaAtividadeAt).getTime();
        }
        if (a.ultimaAtividadeAt && !b.ultimaAtividadeAt) return -1;
        if (!a.ultimaAtividadeAt && b.ultimaAtividadeAt) return 1;
        return a.usuarioId - b.usuarioId;
    });

    const rankingComPosicoes = ranking.map((item, index) => ({
        ...item,
        posicao: index + 1,
        naZonaPro: index < 5 && item.pontos > 0
    }));

    return {
        mesReferencia,
        totalParticipantes: rankingComPosicoes.length,
        ranking: rankingComPosicoes
    };
}


async function executarFechamentoMensal(mesReferenciaParam = null, executadoPorId = null) {
    const mesReferencia = mesReferenciaParam || getMesReferencia();

    const [anoStr, mesStr] = mesReferencia.split("-");
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10);
    let proxAno = ano;
    let proxMes = mes + 1;
    if (proxMes > 12) {
        proxMes = 1;
        proxAno += 1;
    }
    const mesVigencia = `${proxAno}-${String(proxMes).padStart(2, "0")}`;

    const inicioEm = new Date(Date.UTC(proxAno, proxMes - 1, 1, 3, 0, 0));
    const ultimoDia = new Date(Date.UTC(proxAno, proxMes, 0, 23, 59, 59)).getDate();
    const expiraEm = new Date(Date.UTC(proxAno, proxMes - 1, ultimoDia, 26, 59, 59));

    const { ranking } = await obterRankingMensal(mesReferencia);
    const vencedores = ranking.filter(r => r.pontos > 0).slice(0, 5);

    return await prisma.$transaction(async (tx) => {
        const existente = await tx.fechamentoMensal.findUnique({
            where: { mesReferencia }
        });

        if (existente) {
            return {
                sucesso: true,
                jaExecutado: true,
                fechamento: existente,
                mensagem: `O fechamento do mês ${mesReferencia} já havia sido executado anteriormente.`
            };
        }

        const idsVencedores = [];

        for (let i = 0; i < vencedores.length; i++) {
            const v = vencedores[i];
            idsVencedores.push(v.usuarioId);

            await tx.concessaoPro.upsert({
                where: {
                    usuarioId_mesVigencia: {
                        usuarioId: v.usuarioId,
                        mesVigencia
                    }
                },
                update: {
                    posicao: i + 1,
                    pontos: v.pontos,
                    inicioEm,
                    expiraEm,
                    ativo: true
                },
                create: {
                    usuarioId: v.usuarioId,
                    mesReferencia,
                    mesVigencia,
                    posicao: i + 1,
                    pontos: v.pontos,
                    inicioEm,
                    expiraEm,
                    ativo: true
                }
            });

            await tx.usuario.update({
                where: { id: v.usuarioId },
                data: { plano: "PRO" }
            });
        }

        const agora = new Date();
        const usuariosProAtuais = await tx.usuario.findMany({
            where: {
                plano: "PRO",
                id: { notIn: idsVencedores }
            },
            select: { id: true }
        });

        for (const u of usuariosProAtuais) {
            const concessaoValida = await tx.concessaoPro.findFirst({
                where: {
                    usuarioId: u.id,
                    ativo: true,
                    inicioEm: { lte: agora },
                    expiraEm: { gte: agora }
                }
            });

            if (!concessaoValida) {
                await tx.usuario.update({
                    where: { id: u.id },
                    data: { plano: "FREE" }
                });
            }
        }

        const registroFechamento = await tx.fechamentoMensal.create({
            data: {
                mesReferencia,
                executadoPorId,
                totalApurado: ranking.reduce((acc, cur) => acc + cur.pontos, 0),
                topUsuarios: vencedores,
                observacoes: `Fechamento do mês ${mesReferencia} concedendo PRO para vigência ${mesVigencia} aos ${vencedores.length} primeiros colocados.`
            }
        });

        return {
            sucesso: true,
            jaExecutado: false,
            fechamento: registroFechamento,
            vencedores,
            mesVigencia
        };
    });
}


function getInfoPeriodoAtual() {
    const sp = getSaoPauloDate();
    const ano = sp.getFullYear();
    const mes = sp.getMonth();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const fimMes = new Date(ano, mes, ultimoDia, 23, 59, 59, 999);
    const msRestantes = Math.max(0, fimMes.getTime() - sp.getTime());
    const diasRestantes = Math.floor(msRestantes / (1000 * 60 * 60 * 24));
    const horasRestantes = Math.floor((msRestantes % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
        mesAtual: getMesReferencia(),
        diasRestantes,
        horasRestantes,
        dataFim: fimMes.toISOString()
    };
}

module.exports = {
    PONTOS_CONFIG,
    LIMITES_ENGAJAMENTO,
    getSaoPauloDate,
    getMesReferencia,
    getDiaChave,
    getSemanaChave,
    registrarPontos,
    registrarAcessoDiario,
    registrarPublicacaoReceita,
    registrarFavoritoRecebido,
    registrarAvaliacaoRecebida,
    registrarComentarioRecebido,
    registrarSeguirUsuario,
    registrarPerfilCompleto,
    obterRankingMensal,
    executarFechamentoMensal,
    getInfoPeriodoAtual
};

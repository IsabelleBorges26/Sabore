const prisma = require("../data/prisma");
const { getSemanaChave, getSaoPauloDate, getMesReferencia, registrarPontos } = require("./engajamento.service");

/**
 * Garante (de forma aditiva e idempotente) as estruturas do Desafio da Semana no banco.
 * Espelha prisma/migrations/20261106000001_add_desafio_semana e nunca altera dados existentes.
 */
const DDL_DESAFIO = [
  `ALTER TYPE "TipoEngajamento" ADD VALUE IF NOT EXISTS 'DESAFIO_SEMANA'`,
  `CREATE TABLE IF NOT EXISTS "DesafioSemana" (
    "id" SERIAL NOT NULL,
    "semanaChave" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "orientacoes" TEXT NOT NULL,
    "pontosRecompensa" INTEGER NOT NULL DEFAULT 30,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "inicioEm" TIMESTAMP(3) NOT NULL,
    "fimEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DesafioSemana_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ParticipacaoDesafio" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "desafioId" INTEGER NOT NULL,
    "nomeReceita" TEXT NOT NULL,
    "descricaoPreparacao" TEXT NOT NULL,
    "foto" TEXT,
    "pontosConcedidos" INTEGER NOT NULL DEFAULT 0,
    "pontosRegistradosEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParticipacaoDesafio_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DesafioSemana_semanaChave_key" ON "DesafioSemana"("semanaChave")`,
  `CREATE INDEX IF NOT EXISTS "DesafioSemana_inicioEm_idx" ON "DesafioSemana"("inicioEm")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ParticipacaoDesafio_usuarioId_desafioId_key" ON "ParticipacaoDesafio"("usuarioId", "desafioId")`,
  `CREATE INDEX IF NOT EXISTS "ParticipacaoDesafio_desafioId_createdAt_idx" ON "ParticipacaoDesafio"("desafioId", "createdAt")`,
  `DO $$ BEGIN
    ALTER TABLE "ParticipacaoDesafio" ADD CONSTRAINT "ParticipacaoDesafio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "ParticipacaoDesafio" ADD CONSTRAINT "ParticipacaoDesafio_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "DesafioSemana"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`
];

let esquemaPronto = null;
function garantirEsquemaDesafio() {
  if (!esquemaPronto) {
    esquemaPronto = (async () => {
      for (const stmt of DDL_DESAFIO) {
        await prisma.$executeRawUnsafe(stmt);
      }
    })().catch((err) => {
      esquemaPronto = null; // tenta novamente na próxima requisição
      throw err;
    });
  }
  return esquemaPronto;
}

// Pool de desafios gastronômicos predefinidos (serão usados em rotação)
const POOL_DESAFIOS = [
  {
    titulo: "🍓 Sobremesa com Morango",
    tema: "Sobremesas Frutadas",
    descricao: "Prepare uma sobremesa deliciosa usando morango como ingrediente principal. Pode ser um bolo, mousse, pavê, torta ou até uma versão mais criativa!",
    orientacoes: "1. Escolha a sua sobremesa favorita com morango\n2. Prepare com capricho e atenção aos detalhes\n3. Tire uma foto bonita do resultado final\n4. Publique sua participação com o nome do prato e como foi o preparo"
  },
  {
    titulo: "🍫 Criação com Chocolate",
    tema: "O Poder do Chocolate",
    descricao: "O chocolate é versátil e irresistível! Crie uma receita (doce ou até salgada) que tenha chocolate como destaque. Surpreenda a comunidade!",
    orientacoes: "1. Pense em uma forma criativa de usar chocolate\n2. Pode ser bolo, brownie, trufas, fondue ou até algo inusitado\n3. Documente o processo com uma foto do prato pronto\n4. Compartilhe sua receita e conte como foi a experiência"
  },
  {
    titulo: "🥔 Prato Criativo com Batata",
    tema: "A Batata em Destaque",
    descricao: "A batata é um dos ingredientes mais versáteis da cozinha. Vá além das batatas fritas e crie algo diferente e surpreendente!",
    orientacoes: "1. Pense em um uso criativo para a batata\n2. Pode ser recheada, em gnocchi, sopas, bolinhos ou qualquer forma diferente\n3. Fotografe seu prato com cuidado\n4. Publique com nome da receita e descrição do preparo"
  },
  {
    titulo: "🍝 Inspiração Italiana",
    tema: "Culinária Italiana",
    descricao: "A cozinha italiana é rica, saborosa e cheia de tradição. Prepare uma receita inspirada nessa culinária e traga um pedacinho da Itália para sua mesa!",
    orientacoes: "1. Escolha um prato de inspiração italiana (massas, risotos, pizzas, bruschetta, tiramisu...)\n2. Prepare com ingredientes frescos sempre que possível\n3. Registre o momento com uma boa foto\n4. Publique e conte sua experiência culinária"
  },
  {
    titulo: "🏠 Ingredientes que Você Tem em Casa",
    tema: "Criatividade com o que Tem",
    descricao: "Olhe para sua geladeira e despensa e crie uma receita deliciosa com o que você já tem! O desafio é transformar ingredientes simples em algo especial.",
    orientacoes: "1. Liste os ingredientes que você tem disponíveis\n2. Crie uma receita criativa sem precisar comprar nada\n3. Documente o resultado com uma foto\n4. Publique sua criação e liste os ingredientes que usou"
  },
  {
    titulo: "🍗 Frango do seu Jeito",
    tema: "Reinventando o Frango",
    descricao: "O frango é um clássico da cozinha brasileira, mas você pode ir muito além do arroz com frango! Prepare uma receita diferente e mostre sua criatividade.",
    orientacoes: "1. Pense em uma forma nova de preparar frango\n2. Pode ser assado, grelhado, refogado, em caldos, recheado ou qualquer variação criativa\n3. Registre o resultado final com uma boa foto\n4. Publique sua receita com o nome e modo de preparo"
  },
  {
    titulo: "🥗 Salada que Impressiona",
    tema: "Saladas Criativas",
    descricao: "Prove que salada pode ser muito mais do que alface e tomate! Crie uma salada completa, colorida e cheia de sabor que seja um prato à parte.",
    orientacoes: "1. Pense em uma salada que seja o destaque da refeição\n2. Use ingredientes variados: proteínas, grãos, frutas, queijos...\n3. Faça uma montagem bonita e fotografe\n4. Publique com os ingredientes e como você preparou o molho"
  },
  {
    titulo: "🍲 Sopa ou Caldo Especial",
    tema: "Sopas e Caldos",
    descricao: "Nada como um caldo reconfortante! Prepare sua sopa ou caldo favorito e compartilhe essa quentura com a comunidade Saboré.",
    orientacoes: "1. Escolha uma sopa ou caldo que você ama\n2. Prepare com cuidado e tempere bem\n3. Fotografe o prato antes de servir\n4. Publique sua receita com o segredo do sabor especial"
  },
  {
    titulo: "🫓 Pão Artesanal Caseiro",
    tema: "A Arte do Pão Caseiro",
    descricao: "Nada mais gostoso do que pão feito em casa! Prepare qualquer tipo de pão artesanal — simples ou elaborado — e compartilhe essa experiência.",
    orientacoes: "1. Escolha uma receita de pão que você queira experimentar\n2. Siga o processo com carinho (mistura, descanso, forno)\n3. Fotografe o resultado final, preferencialmente cortado\n4. Publique e conte como foi a experiência de fazer pão em casa"
  },
  {
    titulo: "🌶️ Comida com Sabor Nordestino",
    tema: "Nordeste na Mesa",
    descricao: "A culinária nordestina é rica, colorida e cheia de personalidade. Prepare um prato inspirado no Nordeste e celebre essa cultura gastronômica incrível!",
    orientacoes: "1. Escolha um prato nordestino (carne de sol, baião de dois, acarajé, cuscuz, buchada...)\n2. Use os temperos e ingredientes característicos da região\n3. Registre o prato com uma foto colorida\n4. Publique sua receita e conte a história do prato"
  }
];

/**
 * Retorna o desafio da semana atual, criando-o automaticamente se não existir
 */
async function obterDesafioAtual() {
  await garantirEsquemaDesafio();
  const semanaChave = getSemanaChave();

  // Busca o desafio existente para esta semana
  let desafio = await prisma.desafioSemana.findUnique({
    where: { semanaChave },
    include: {
      participacoes: {
        select: {
          id: true,
          usuarioId: true,
          nomeReceita: true,
          descricaoPreparacao: true,
          foto: true,
          pontosConcedidos: true,
          createdAt: true,
          usuario: {
            select: { id: true, nome: true, foto: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!desafio) {
    desafio = await criarDesafioParaSemana(semanaChave);
  }

  return desafio;
}

/**
 * Cria o desafio para a semana atual usando rotação do pool
 */
async function criarDesafioParaSemana(semanaChave) {
  const sp = getSaoPauloDate();

  // Calcula qual desafio usar (rotação pelo número da semana)
  const weekNum = parseInt(semanaChave.split('-W')[1]) || 1;
  const desafioBase = POOL_DESAFIOS[(weekNum - 1) % POOL_DESAFIOS.length];

  // Início: segunda-feira desta semana
  const diaSemana = sp.getDay(); // 0=dom, 1=seg
  const diasAtrasSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioSemana = new Date(sp);
  inicioSemana.setDate(sp.getDate() - diasAtrasSegunda);
  inicioSemana.setHours(0, 0, 0, 0);

  // Fim: domingo desta semana às 23:59:59
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);

  try {
    return await prisma.desafioSemana.create({
      data: {
        semanaChave,
        titulo: desafioBase.titulo,
        descricao: desafioBase.descricao,
        tema: desafioBase.tema,
        orientacoes: desafioBase.orientacoes,
        pontosRecompensa: 30,
        ativo: true,
        inicioEm: inicioSemana,
        fimEm: fimSemana
      },
      include: {
        participacoes: {
          select: {
            id: true,
            usuarioId: true,
            nomeReceita: true,
            descricaoPreparacao: true,
            foto: true,
            pontosConcedidos: true,
            createdAt: true,
            usuario: {
              select: { id: true, nome: true, foto: true }
            }
          }
        }
      }
    });
  } catch (err) {
    if (err.code === 'P2002') {
      // Já foi criado por outra requisição concorrente
      return prisma.desafioSemana.findUnique({
        where: { semanaChave },
        include: { participacoes: { include: { usuario: { select: { id: true, nome: true, foto: true } } } } }
      });
    }
    throw err;
  }
}

/**
 * Publica participação no desafio e concede pontos (idempotente por usuário+desafio)
 */
async function publicarParticipacao(usuarioId, desafioId, { nomeReceita, descricaoPreparacao, foto }) {
  if (!usuarioId || !desafioId || !nomeReceita || !descricaoPreparacao) {
    throw new Error("Dados obrigatórios: nomeReceita e descricaoPreparacao são necessários.");
  }

  if (foto) {
    const fotoStr = String(foto).trim();
    const isDataUrl = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(fotoStr);
    const isHttpUrl = /^https?:\/\//i.test(fotoStr);
    if (!isDataUrl && !isHttpUrl) {
      throw new Error("Formato de imagem inválido. Envie uma imagem válida (JPG, PNG, WEBP ou GIF).");
    }
    if (fotoStr.length > 8 * 1024 * 1024) {
      throw new Error("A imagem enviada é muito grande. Selecione uma imagem de até 10 MB.");
    }
  }

  await garantirEsquemaDesafio();

  // Verifica se o desafio existe e está ativo
  const desafio = await prisma.desafioSemana.findUnique({ where: { id: desafioId } });
  if (!desafio) throw new Error("Desafio não encontrado.");
  if (!desafio.ativo) throw new Error("Este desafio não está mais ativo.");

  // Verifica se já publicou para este desafio
  const jaPublicou = await prisma.participacaoDesafio.findUnique({
    where: { usuarioId_desafioId: { usuarioId, desafioId } }
  });
  if (jaPublicou) {
    throw new Error("Você já publicou sua participação neste desafio. Os pontos já foram concedidos anteriormente.");
  }

  const chaveUnica = `DESAFIO_${desafioId}_USR_${usuarioId}`;

  // Cria participação e registra pontos
  const participacao = await prisma.participacaoDesafio.create({
    data: {
      usuarioId,
      desafioId,
      nomeReceita: nomeReceita.trim(),
      descricaoPreparacao: descricaoPreparacao.trim(),
      foto: foto || null,
      pontosConcedidos: desafio.pontosRecompensa,
      pontosRegistradosEm: new Date()
    }
  });

  // Registra pontos no sistema de engajamento
  await registrarPontos({
    usuarioId,
    tipo: "DESAFIO_SEMANA",
    pontos: desafio.pontosRecompensa,
    chaveUnica,
    referenciaId: desafioId,
    descricao: `Desafio da Semana concluído: "${desafio.titulo}" — Receita: "${nomeReceita}"`
  });

  return {
    participacao,
    pontosConcedidos: desafio.pontosRecompensa,
    mensagem: `Parabéns! Você ganhou ${desafio.pontosRecompensa} pontos por participar do desafio!`
  };
}

/**
 * Verifica se o usuário já participou do desafio atual
 */
async function verificarParticipacaoUsuario(usuarioId, desafioId) {
  if (!usuarioId || !desafioId) return null;
  await garantirEsquemaDesafio();
  return prisma.participacaoDesafio.findUnique({
    where: { usuarioId_desafioId: { usuarioId, desafioId } }
  });
}

/**
 * Busca histórico de desafios anteriores
 */
async function listarDesafiosAnteriores(limite = 10) {
  await garantirEsquemaDesafio();
  const semanaAtual = getSemanaChave();
  return prisma.desafioSemana.findMany({
    where: { semanaChave: { not: semanaAtual } },
    orderBy: { inicioEm: 'desc' },
    take: limite,
    include: {
      _count: { select: { participacoes: true } }
    }
  });
}

module.exports = {
  obterDesafioAtual,
  criarDesafioParaSemana,
  publicarParticipacao,
  verificarParticipacaoUsuario,
  listarDesafiosAnteriores,
  POOL_DESAFIOS
};

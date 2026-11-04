CREATE TYPE "TipoDesafio" AS ENUM ('HASHTAG', 'CRIATIVIDADE', 'META');
CREATE TYPE "StatusDesafio" AS ENUM ('RASCUNHO', 'INSCRICOES', 'ENVIO', 'VOTACAO', 'ENCERRADO');

CREATE TABLE "Desafio" (
  "id" SERIAL PRIMARY KEY,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "hashtag" TEXT NOT NULL UNIQUE,
  "tipo" "TipoDesafio" NOT NULL,
  "status" "StatusDesafio" NOT NULL DEFAULT 'RASCUNHO',
  "comecaEm" TIMESTAMP(3) NOT NULL,
  "encerraEm" TIMESTAMP(3) NOT NULL,
  "votacaoIniciaEm" TIMESTAMP(3),
  "votacaoEncerraEm" TIMESTAMP(3),
  "premioProMeses" INTEGER NOT NULL DEFAULT 0,
  "emblema" TEXT,
  "molduraPerfil" TEXT,
  "criadoPorId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "DesafioEntrada" (
  "id" SERIAL PRIMARY KEY,
  "desafioId" INTEGER NOT NULL REFERENCES "Desafio"("id") ON DELETE CASCADE,
  "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "receitaId" INTEGER NOT NULL UNIQUE REFERENCES "Receita"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("desafioId", "usuarioId", "receitaId")
);
CREATE TABLE "DesafioVoto" (
  "id" SERIAL PRIMARY KEY,
  "desafioId" INTEGER NOT NULL REFERENCES "Desafio"("id") ON DELETE CASCADE,
  "entradaId" INTEGER NOT NULL REFERENCES "DesafioEntrada"("id") ON DELETE CASCADE,
  "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("desafioId", "usuarioId")
);
CREATE TABLE "ConquistaUsuario" (
  "id" SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "desafioId" INTEGER,
  "titulo" TEXT NOT NULL,
  "emblema" TEXT NOT NULL,
  "molduraPerfil" TEXT,
  "concedidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "DesafioEntrada_desafioId_idx" ON "DesafioEntrada"("desafioId");
CREATE INDEX "ConquistaUsuario_usuarioId_concedidaEm_idx" ON "ConquistaUsuario"("usuarioId", "concedidaEm");
ALTER TABLE "Desafio" ADD CONSTRAINT "Desafio_criadoPorId_fkey"
  FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConquistaUsuario" ADD CONSTRAINT "ConquistaUsuario_desafioId_fkey"
  FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Desafio" (
  "titulo", "descricao", "hashtag", "tipo", "status", "comecaEm", "encerraEm",
  "votacaoIniciaEm", "votacaoEncerraEm", "premioProMeses", "emblema", "molduraPerfil"
) VALUES (
  'Desafio de Natal Saboré 2026',
  'Crie a receita natalina mais criativa. Publique uma receita original com a hashtag oficial até 22 de dezembro. De 23 a 25 de dezembro, participantes inscritos votam nas receitas; não é permitido votar na própria publicação.',
  '#DesafioNatalSabore2026', 'CRIATIVIDADE', 'INSCRICOES', CURRENT_TIMESTAMP,
  '2026-12-22 23:59:59', '2026-12-23 00:00:00', '2026-12-25 23:59:59', 1,
  'Campeão do Natal Saboré 2026', 'moldura-natal-sabore-2026'
);

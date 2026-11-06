-- Migração aditiva (PostgreSQL): Desafio da Semana. Não altera nem remove dados existentes.

-- AlterEnum
ALTER TYPE "TipoEngajamento" ADD VALUE IF NOT EXISTS 'DESAFIO_SEMANA';

-- CreateTable
CREATE TABLE IF NOT EXISTS "DesafioSemana" (
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
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ParticipacaoDesafio" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DesafioSemana_semanaChave_key" ON "DesafioSemana"("semanaChave");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DesafioSemana_inicioEm_idx" ON "DesafioSemana"("inicioEm");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ParticipacaoDesafio_usuarioId_desafioId_key" ON "ParticipacaoDesafio"("usuarioId", "desafioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ParticipacaoDesafio_desafioId_createdAt_idx" ON "ParticipacaoDesafio"("desafioId", "createdAt");

-- AddForeignKey
ALTER TABLE "ParticipacaoDesafio" ADD CONSTRAINT "ParticipacaoDesafio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoDesafio" ADD CONSTRAINT "ParticipacaoDesafio_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "DesafioSemana"("id") ON DELETE CASCADE ON UPDATE CASCADE;


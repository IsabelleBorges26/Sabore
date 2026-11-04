CREATE TABLE "DesafioParticipacao" (
    "id" SERIAL NOT NULL,
    "desafioChave" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesafioParticipacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DesafioParticipacao_desafioChave_usuarioId_key"
  ON "DesafioParticipacao"("desafioChave", "usuarioId");
CREATE INDEX "DesafioParticipacao_desafioChave_idx"
  ON "DesafioParticipacao"("desafioChave");

ALTER TABLE "DesafioParticipacao"
  ADD CONSTRAINT "DesafioParticipacao_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

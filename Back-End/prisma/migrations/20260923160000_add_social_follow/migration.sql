CREATE TABLE "Seguidor" (
    "id" SERIAL NOT NULL,
    "seguidorId" INTEGER NOT NULL,
    "seguidoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Seguidor_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Receita" ADD COLUMN "publicadaEm" TIMESTAMP(3);

CREATE UNIQUE INDEX "Seguidor_seguidorId_seguidoId_key" ON "Seguidor"("seguidorId", "seguidoId");
CREATE INDEX "Seguidor_seguidoId_idx" ON "Seguidor"("seguidoId");

ALTER TABLE "Seguidor" ADD CONSTRAINT "Seguidor_seguidorId_fkey"
  FOREIGN KEY ("seguidorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Seguidor" ADD CONSTRAINT "Seguidor_seguidoId_fkey"
  FOREIGN KEY ("seguidoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

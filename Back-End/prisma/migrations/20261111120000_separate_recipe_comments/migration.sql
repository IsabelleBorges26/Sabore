CREATE TABLE IF NOT EXISTS "Comentario" (
  "id" SERIAL NOT NULL,
  "texto" TEXT NOT NULL,
  "nota" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "receitaId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Comentario_receitaId_createdAt_idx" ON "Comentario"("receitaId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comentario_usuarioId_receitaId_idx" ON "Comentario"("usuarioId", "receitaId");
CREATE INDEX IF NOT EXISTS "Favorito_receitaId_idx" ON "Favorito"("receitaId");
CREATE INDEX IF NOT EXISTS "Avaliacao_receitaId_idx" ON "Avaliacao"("receitaId");
CREATE INDEX IF NOT EXISTS "Compartilhamento_receitaId_idx" ON "Compartilhamento"("receitaId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comentario_usuarioId_fkey') THEN
    ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_usuarioId_fkey"
      FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comentario_receitaId_fkey') THEN
    ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_receitaId_fkey"
      FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "Comentario" ("texto", "nota", "usuarioId", "receitaId", "createdAt")
SELECT TRIM(a."comentario"), a."nota", a."usuarioId", a."receitaId", a."createdAt"
FROM "Avaliacao" a
WHERE a."comentario" IS NOT NULL AND TRIM(a."comentario") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "Comentario" c
    WHERE c."usuarioId" = a."usuarioId" AND c."receitaId" = a."receitaId"
      AND c."texto" = TRIM(a."comentario") AND c."createdAt" = a."createdAt"
  );

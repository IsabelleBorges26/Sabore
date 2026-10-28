CREATE TABLE "Hashtag" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReceitaHashtag" (
    "id" SERIAL NOT NULL,
    "receitaId" INTEGER NOT NULL,
    "hashtagId" INTEGER NOT NULL,
    CONSTRAINT "ReceitaHashtag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Hashtag_nome_key" ON "Hashtag"("nome");
CREATE UNIQUE INDEX "ReceitaHashtag_receitaId_hashtagId_key" ON "ReceitaHashtag"("receitaId", "hashtagId");
CREATE INDEX "ReceitaHashtag_hashtagId_idx" ON "ReceitaHashtag"("hashtagId");
ALTER TABLE "ReceitaHashtag" ADD CONSTRAINT "ReceitaHashtag_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReceitaHashtag" ADD CONSTRAINT "ReceitaHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

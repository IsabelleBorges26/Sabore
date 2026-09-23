const prisma = require("../src/data/prisma");

const run = prisma.$executeRawUnsafe.bind(prisma);

async function apply() {
    await run('CREATE TABLE IF NOT EXISTS "Seguidor" ("id" SERIAL NOT NULL, "seguidorId" INTEGER NOT NULL, "seguidoId" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Seguidor_pkey" PRIMARY KEY ("id"))');
    await run('ALTER TABLE "Receita" ADD COLUMN IF NOT EXISTS "publicadaEm" TIMESTAMP(3)');
    await run('CREATE UNIQUE INDEX IF NOT EXISTS "Seguidor_seguidorId_seguidoId_key" ON "Seguidor"("seguidorId", "seguidoId")');
    await run('CREATE INDEX IF NOT EXISTS "Seguidor_seguidoId_idx" ON "Seguidor"("seguidoId")');
    await run("DO LANGUAGE plpgsql $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Seguidor_seguidorId_fkey') THEN ALTER TABLE \"Seguidor\" ADD CONSTRAINT \"Seguidor_seguidorId_fkey\" FOREIGN KEY (\"seguidorId\") REFERENCES \"Usuario\"(\"id\") ON DELETE CASCADE; END IF; IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Seguidor_seguidoId_fkey') THEN ALTER TABLE \"Seguidor\" ADD CONSTRAINT \"Seguidor_seguidoId_fkey\" FOREIGN KEY (\"seguidoId\") REFERENCES \"Usuario\"(\"id\") ON DELETE CASCADE; END IF; END $$");
    const [seguidores, publicacoes] = await Promise.all([
        prisma.seguidor.count(),
        prisma.receita.count({ where: { publica: true, publicadaEm: { not: null } } })
    ]);
    console.log(`SOCIAL_SCHEMA_APPLIED seguidores=${seguidores} publicacoes=${publicacoes}`);
}

apply()
    .catch((error) => {
        console.error("SOCIAL_SCHEMA_ERROR", error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());

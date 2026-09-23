<<<<<<< HEAD
const { PrismaClient } = require("@prisma/client");// O Prisma mantém conexões abertas; por isso a URL direta/session pooler é// mais adequada para a API que o transaction pooler da porta 6543.const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;const prisma = new PrismaClient({    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,    transactionOptions: {        maxWait: 10000,        timeout: 30000    }});module.exports = prisma;
=======
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não foi configurada em Back-End/.env");
}

const runtimeDatabaseUrl = new URL(process.env.DATABASE_URL);
if (!runtimeDatabaseUrl.searchParams.has("sslmode")) {
    runtimeDatabaseUrl.searchParams.set("sslmode", "require");
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: runtimeDatabaseUrl.toString()
        }
    },
    // Os controllers tratam os erros. Evita que o Prisma imprima mensagens
    // internas antes de o fallback HTTPS assumir a leitura.
    log: process.env.NODE_ENV === "development" ? ["warn"] : []
});

module.exports = prisma;
>>>>>>> e4cf63f41d9c2b65a92b2648a0c1c6a41bd3a5f5

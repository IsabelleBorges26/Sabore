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

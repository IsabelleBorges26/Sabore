const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não foi configurada em Back-End/.env");
}

if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL não foi configurada em Back-End/.env");
}

// Este backend Node mantém conexões persistentes, então usa o Session Pooler
// (5432). O Transaction Pooler (6543) fica para ambientes serverless.
const runtimeDatabaseUrl = new URL(process.env.DIRECT_URL);
runtimeDatabaseUrl.searchParams.delete("sslrootcert");
runtimeDatabaseUrl.searchParams.set("sslmode", "require");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: runtimeDatabaseUrl.toString()
        }
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
});

module.exports = prisma;

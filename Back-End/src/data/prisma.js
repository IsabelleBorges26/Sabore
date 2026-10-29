const { PrismaClient } = require("@prisma/client");

// No Supabase e Vercel Serverless, use DATABASE_URL (Transaction Pooler - porta 6543)
// para evitar estourar o limite de conexões do plano gratuito (max 15 clients).
// Se DIRECT_URL estiver definida e explicitamente preferida, pode ser usada localmente.
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
const prisma = new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    transactionOptions: {
        maxWait: 10000,
        timeout: 30000
    }
});

module.exports = prisma;

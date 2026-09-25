const { PrismaClient } = require("@prisma/client");

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    transactionOptions: {
        maxWait: 10000,
        timeout: 30000
    }
});

module.exports = prisma;

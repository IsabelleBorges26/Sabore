<<<<<<< HEAD
const { PrismaClient } = require("@prisma/client");// O Prisma mantém conexões abertas; por isso a URL direta/session pooler é// mais adequada para a API que o transaction pooler da porta 6543.const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;const prisma = new PrismaClient({    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,    transactionOptions: {        maxWait: 10000,        timeout: 30000    }});module.exports = prisma;
=======
const { PrismaClient } = require("@prisma/client");

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
const prisma = new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    transactionOptions: {
        maxWait: 10000,
        timeout: 30000
    }
});

module.exports = prisma;
>>>>>>> bf6bdb9ad30543104ca05bc226459cc5e5d70ba7

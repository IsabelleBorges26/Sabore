import "dotenv/config";
import { defineConfig } from "prisma/config";

function withSsl(url: string | undefined) {
    if (!url) return url;

    const separator = url.includes("?") ? "&" : "?";

    return /(?:^|[?&])sslmode=/.test(url)
        ? url
        : `${url}${separator}sslmode=require`;
}

console.log("DATABASE:", process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@"));
console.log("DIRECT:", process.env.DIRECT_URL?.replace(/:([^:@]+)@/, ":***@"));

export default defineConfig({
    schema: "prisma/schema.prisma",

    migrations: {
        path: "prisma/migrations",
    },

    datasource: {
        url: withSsl(process.env.DATABASE_URL)!,
    },
});
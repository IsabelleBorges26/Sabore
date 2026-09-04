import "dotenv/config";
import { defineConfig } from "prisma/config";

function withSsl(url: string | undefined) {
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return /(?:^|[?&])sslmode=/.test(url) ? url : `${url}${separator}sslmode=require`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: withSsl(process.env["DIRECT_URL"])!,
  },
});

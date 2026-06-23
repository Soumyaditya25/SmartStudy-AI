import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // url is used by CLI commands: prisma db push, prisma migrate
    // The runtime adapter (PrismaPg) is configured in src/lib/prisma.ts
    url: process.env.DATABASE_URL ?? "",
  },
});


import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // url is required by prisma db push / migrate CLI commands
    url: process.env.DATABASE_URL ?? "",
    // adapter is used by the runtime PrismaClient for pooled connections
    adapter: () => {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      });
      return new PrismaPg(pool);
    },
  },
});

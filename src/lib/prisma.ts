import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL || 'file:./dev.db'
  // Prisma 7 adapter-better-sqlite3 constructor takes a config object with url
  const adapter = new PrismaBetterSqlite3({
    url: url
  })
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

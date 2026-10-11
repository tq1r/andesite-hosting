import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * On serverless platforms (Vercel) the filesystem is read-only except /tmp.
 * Copy the bundled SQLite snapshot to /tmp on first use per instance so the
 * demo works out of the box. Data is ephemeral there — run locally (or point
 * DATABASE_URL at a real database) for persistence.
 */
function resolveDatasourceUrl(): string | undefined {
  if (process.env.VERCEL) {
    try {
      const tmp = '/tmp/andesite.db'
      if (!fs.existsSync(tmp)) {
        fs.copyFileSync(path.join(process.cwd(), 'db', 'custom.db'), tmp)
      }
      return `file:${tmp}`
    } catch {
      // fall through to whatever DATABASE_URL provides
    }
  }
  return process.env.DATABASE_URL
}

const url = resolveDatasourceUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

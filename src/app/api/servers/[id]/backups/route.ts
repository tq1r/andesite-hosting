import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createBackupFor } from '@/lib/seed'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const backups = await db.backup.findMany({ where: { serverId: id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ backups })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : undefined
  const backup = await createBackupFor(server, name)
  return NextResponse.json({ backup }, { status: 201 })
}

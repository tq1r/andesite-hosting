import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// POST = restore this backup
export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const backup = await db.backup.findUnique({ where: { id } })
  if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 })

  const server = await db.server.findUnique({ where: { id: backup.serverId } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  await db.activity.create({
    data: {
      type: 'restore',
      message: `Backup "${backup.name}" restored on "${server.name}"`,
      serverId: server.id,
      serverName: server.name,
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const backup = await db.backup.findUnique({ where: { id } })
  if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 })

  await db.backup.delete({ where: { id } })
  await db.activity.create({
    data: {
      type: 'backup',
      message: `Backup "${backup.name}" deleted from "${backup.serverId}"`,
      serverId: backup.serverId,
      serverName: null,
    },
  })
  return NextResponse.json({ ok: true })
}

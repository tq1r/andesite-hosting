import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 60) : `world-backup_${stamp}`

  // Simulated world size: scales with RAM tier
  const sizeMb = Math.round((40 + Math.random() * 90) * (server.ramMb / 4096) * 10) / 10
  const backup = await db.backup.create({ data: { serverId: id, name, sizeMb } })

  await db.activity.create({
    data: {
      type: 'backup',
      message: `Backup "${name}" created (${sizeMb} MB) for "${server.name}"`,
      serverId: id,
      serverName: server.name,
    },
  })
  return NextResponse.json({ backup }, { status: 201 })
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getEngineStatuses } from '@/lib/engine'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const players = await db.player.findMany({
    where: { serverId: id },
    orderBy: [{ isOp: 'desc' }, { name: 'asc' }],
  })
  const statuses = await getEngineStatuses()
  const onlineNames = statuses[id]?.onlineNames ?? []
  return NextResponse.json({
    players: players.map((p) => ({ ...p, isOnline: onlineNames.includes(p.name) })),
  })
}

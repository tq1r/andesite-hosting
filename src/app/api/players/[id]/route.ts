import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  isOp: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  isWhitelisted: z.boolean().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const player = await db.player.findUnique({ where: { id }, include: { server: true } })
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const updated = await db.player.update({ where: { id }, data: parsed.data })

  let message = ''
  if (parsed.data.isOp === true) message = `${player.name} was promoted to operator on "${player.server.name}"`
  else if (parsed.data.isOp === false) message = `${player.name} was demoted from operator on "${player.server.name}"`
  else if (parsed.data.isBanned === true) message = `${player.name} was banned from "${player.server.name}"`
  else if (parsed.data.isBanned === false) message = `${player.name} was unbanned from "${player.server.name}"`
  else if (parsed.data.isWhitelisted !== undefined) message = `Whitelist updated for ${player.name} on "${player.server.name}"`
  if (message) {
    await db.activity.create({
      data: { type: 'player', message, serverId: player.serverId, serverName: player.server.name },
    })
  }

  return NextResponse.json({ player: updated })
}

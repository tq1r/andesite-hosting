import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEngineStatuses, FALLBACK_STATUS, notifyEngineServerDeleted, syncSchedules } from '@/lib/engine'
import { genProperties, serverPluginNames } from '@/lib/seed'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  motd: z.string().trim().min(1).max(59).optional(),
  maxPlayers: z.number().int().min(2).max(200).optional(),
  ramMb: z.number().int().min(1024).max(16384).optional(),
  region: z.enum(['us-east', 'us-west', 'eu-central', 'eu-west', 'ap-south', 'ap-northeast']).optional(),
  gamemode: z.enum(['survival', 'creative', 'adventure', 'spectator']).optional(),
  difficulty: z.enum(['peaceful', 'easy', 'normal', 'hard']).optional(),
  worldType: z.enum(['normal', 'flat', 'large_biomes', 'amplified']).optional(),
  pvp: z.boolean().optional(),
  onlineMode: z.boolean().optional(),
  whitelist: z.boolean().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({
    where: { id },
    include: { _count: { select: { players: true, backups: true } } },
  })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })
  const statuses = await getEngineStatuses()
  const st = statuses[id] ?? FALLBACK_STATUS
  const plugins = await serverPluginNames(id)
  return NextResponse.json({
    server: {
      ...server,
      playerCount: server._count.players,
      backupCount: server._count.backups,
      plugins,
      status: st.status,
      playersOnline: st.playersOnline,
      uptimeSec: st.uptimeSec,
    },
  })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid settings', details: parsed.error.flatten() }, { status: 400 })
  }
  const updated = await db.server.update({ where: { id }, data: parsed.data })

  // Regenerate server.properties if any world/gameplay setting changed
  const propKeys = ['motd', 'maxPlayers', 'gamemode', 'difficulty', 'worldType', 'pvp', 'onlineMode', 'whitelist', 'region'] as const
  if (propKeys.some((k) => k in parsed.data)) {
    const content = genProperties({
      motd: updated.motd,
      port: updated.port,
      gamemode: updated.gamemode,
      difficulty: updated.difficulty,
      maxPlayers: updated.maxPlayers,
      pvp: updated.pvp,
      onlineMode: updated.onlineMode,
      whitelist: updated.whitelist,
      worldType: updated.worldType,
      region: updated.region,
    })
    await db.fileNode.updateMany({
      where: { serverId: id, parentId: null, name: 'server.properties' },
      data: { content, size: content.length },
    })
  }

  await db.activity.create({
    data: {
      type: 'settings',
      message: `Settings updated for "${updated.name}"`,
      serverId: updated.id,
      serverName: updated.name,
    },
  })

  return NextResponse.json({ server: updated })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  await notifyEngineServerDeleted(id)
  await db.server.delete({ where: { id } })
  await syncSchedules()
  await db.activity.create({
    data: {
      type: 'deleted',
      message: `Server "${server.name}" deleted`,
      serverId: null,
      serverName: server.name,
    },
  })
  return NextResponse.json({ ok: true })
}

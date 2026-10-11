import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getEngineStatuses, FALLBACK_STATUS } from '@/lib/engine'
import { genProperties, seedFileTree, seedPlayers, pickPort } from '@/lib/seed'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  platform: z.enum(['vanilla', 'paper', 'spigot', 'fabric', 'forge']),
  version: z.string().min(1).max(12),
  motd: z.string().trim().min(1).max(59).default('A CraftHost Server'),
  maxPlayers: z.number().int().min(2).max(200).default(20),
  ramMb: z.number().int().min(1024).max(16384).default(2048),
  region: z.enum(['us-east', 'us-west', 'eu-central', 'eu-west', 'ap-south', 'ap-northeast']).default('us-east'),
  gamemode: z.enum(['survival', 'creative', 'adventure', 'spectator']).default('survival'),
  difficulty: z.enum(['peaceful', 'easy', 'normal', 'hard']).default('normal'),
  worldType: z.enum(['normal', 'flat', 'large_biomes', 'amplified']).default('normal'),
  pvp: z.boolean().default(true),
  onlineMode: z.boolean().default(true),
  whitelist: z.boolean().default(false),
})

export async function GET() {
  const servers = await db.server.findMany({
    include: { _count: { select: { players: true, backups: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const statuses = await getEngineStatuses()
  return NextResponse.json({
    servers: servers.map((s) => {
      const st = statuses[s.id] ?? FALLBACK_STATUS
      return {
        ...s,
        playerCount: s._count.players,
        backupCount: s._count.backups,
        status: st.status,
        playersOnline: st.playersOnline,
        uptimeSec: st.uptimeSec,
      }
    }),
  })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid server configuration', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const port = await pickPort()

  const server = await db.server.create({ data: { ...data, port } })

  const props = genProperties(data)
  await seedFileTree(server.id, data.platform, props)
  await seedPlayers(server.id, data.whitelist)

  await db.activity.create({
    data: {
      type: 'created',
      message: `Server "${server.name}" deployed — ${data.platform === 'vanilla' ? 'Vanilla' : data.platform} ${data.version} on ${data.ramMb >= 1024 ? `${data.ramMb / 1024} GB` : `${data.ramMb} MB`} RAM`,
      serverId: server.id,
      serverName: server.name,
    },
  })

  return NextResponse.json({ server: { ...server, status: 'offline', playersOnline: 0, uptimeSec: 0, playerCount: 0, backupCount: 0 } }, { status: 201 })
}

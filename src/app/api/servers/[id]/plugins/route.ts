import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { engineCommand } from '@/lib/engine'
import { PLUGIN_CATALOG } from '@/lib/mc'
import { serverPluginNames } from '@/lib/seed'

export const dynamic = 'force-dynamic'

const actionSchema = z.object({
  pluginId: z.string().min(1).max(64),
  action: z.enum(['install', 'uninstall']),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })
  return NextResponse.json({ installed: await serverPluginNames(id) })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const parsed = actionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { pluginId, action } = parsed.data

  const item = PLUGIN_CATALOG.find((p) => p.id === pluginId)
  if (!item) return NextResponse.json({ error: 'Unknown plugin' }, { status: 404 })
  if (!item.platforms.includes(server.platform)) {
    return NextResponse.json({ error: `${item.name} doesn't support ${server.platform}` }, { status: 400 })
  }

  // plugins/ for bukkit platforms, mods/ for fabric/forge
  const dirName = server.platform === 'fabric' || server.platform === 'forge' ? 'mods' : 'plugins'
  let dir = await db.fileNode.findFirst({ where: { serverId: id, parentId: null, isDir: true, name: dirName } })
  if (!dir && action === 'install') {
    dir = await db.fileNode.create({ data: { serverId: id, parentId: null, name: dirName, isDir: true } })
  }
  if (!dir) return NextResponse.json({ error: 'Nothing to uninstall' }, { status: 400 })

  const jarName = `${item.jarPrefix}${item.version}.jar`

  if (action === 'install') {
    const exists = await db.fileNode.findFirst({ where: { serverId: id, parentId: dir.id, name: jarName } })
    if (!exists) {
      await db.fileNode.create({
        data: { serverId: id, parentId: dir.id, name: jarName, isDir: false, content: null, size: item.sizeKb * 1024 },
      })
    }
    await db.activity.create({
      data: {
        type: 'plugin',
        message: `${item.name} v${item.version} installed on "${server.name}"`,
        serverId: id,
        serverName: server.name,
      },
    })
    // announce on the live console if the server is running
    await engineCommand(id, `say [CraftHost] Installed ${item.name} v${item.version} — restart to load it`)
    return NextResponse.json({ ok: true, installed: await serverPluginNames(id) }, { status: 201 })
  }

  // uninstall — remove every jar matching this plugin's prefix in the folder
  const jars = await db.fileNode.findMany({ where: { serverId: id, parentId: dir.id, name: { startsWith: item.jarPrefix } } })
  if (!jars.length) return NextResponse.json({ error: `${item.name} is not installed` }, { status: 400 })
  await db.fileNode.deleteMany({ where: { id: { in: jars.map((j) => j.id) } } })
  await db.activity.create({
    data: {
      type: 'plugin',
      message: `${item.name} removed from "${server.name}"`,
      serverId: id,
      serverName: server.name,
    },
  })
  return NextResponse.json({ ok: true, installed: await serverPluginNames(id) })
}

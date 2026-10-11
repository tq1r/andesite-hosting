import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { versionsForPlatform } from '@/lib/mc'

export const dynamic = 'force-dynamic'

const schema = z.object({ version: z.string().min(1).max(12) })

type Ctx = { params: Promise<{ id: string }> }

/** Reinstall the server core on a different version (world, backups, add-ons
 *  and settings are preserved — like every real host's version switcher). */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid version' }, { status: 400 })
  const { version } = parsed.data

  const allowed = versionsForPlatform(server.platform).map((v) => v.id)
  if (!allowed.includes(version)) {
    return NextResponse.json({ error: `${server.platform} doesn't build ${version}` }, { status: 400 })
  }
  if (version === server.version) {
    return NextResponse.json({ error: `Already on ${version}` }, { status: 400 })
  }

  const updated = await db.server.update({ where: { id }, data: { version } })

  // refresh the seeded boot log so the Files tab reflects the new version
  const logs = await db.fileNode.findFirst({ where: { serverId: id, name: 'logs', isDir: true } })
  if (logs) {
    const latest = await db.fileNode.findFirst({ where: { parentId: logs.id, name: 'latest.log' } })
    if (latest) {
      const d = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const ts = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      const content = [
        `[${ts}] [ServerMain/INFO]: Loading Minecraft ${version} with Java 25.0.2`,
        `[${ts}] [ServerMain/INFO]: Loading server properties`,
        `[${ts}] [ServerMain/INFO]: Default game type: ${server.gamemode.toUpperCase()}`,
        `[${ts}] [Server thread/INFO]: Starting minecraft server version ${version}`,
        `[${ts}] [Server thread/INFO]: Preparing level "world"`,
        `[${ts}] [Server thread/INFO]: Done (3.212s)! For help, type "help"`,
      ].join('\n')
      await db.fileNode.update({ where: { id: latest.id }, data: { content, size: content.length } })
    }
  }

  await db.activity.create({
    data: {
      type: 'reinstall',
      message: `"${server.name}" reinstalled on ${version} (was ${server.version}) — world and add-ons kept`,
      serverId: id,
      serverName: server.name,
    },
  })

  return NextResponse.json({ server: updated, previousVersion: server.version })
}

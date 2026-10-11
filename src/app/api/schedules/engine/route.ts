import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serverPluginNames } from '@/lib/seed'

export const dynamic = 'force-dynamic'

/** Bootstrap endpoint for the mc-engine watchdog: full schedule list + server
 *  configs (called by the engine on boot, localhost only). */
export async function GET() {
  const [schedules, servers] = await Promise.all([
    db.schedule.findMany(),
    db.server.findMany(),
  ])
  const pluginLists = await Promise.all(servers.map((s) => serverPluginNames(s.id)))
  const cfgs = Object.fromEntries(
    servers.map((s, i) => [s.id, {
      id: s.id, name: s.name, platform: s.platform, version: s.version,
      motd: s.motd, maxPlayers: s.maxPlayers, ramMb: s.ramMb, port: s.port,
      gamemode: s.gamemode, difficulty: s.difficulty,
      plugins: pluginLists[i],
    }])
  )
  return NextResponse.json({
    schedules: schedules.map((x) => ({
      id: x.id, serverId: x.serverId, everyMin: x.everyMin, action: x.action,
      payload: x.payload, enabled: x.enabled,
      lastRunAt: x.lastRunAt ? x.lastRunAt.getTime() : 0,
    })),
    cfgs,
  })
}

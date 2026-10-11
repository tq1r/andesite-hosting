// Server-side helper to talk to the mc-engine mini-service (internal, localhost only)
import { db } from '@/lib/db'
import type { EngineStatusInfo, ServerStatus } from '@/lib/mc'
import { serverPluginNames } from '@/lib/seed'

const ENGINE_URL = 'http://localhost:3004'

export async function getEngineStatuses(): Promise<Record<string, EngineStatusInfo>> {
  try {
    const res = await fetch(`${ENGINE_URL}/internal/statuses`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return {}
    return (await res.json()) as Record<string, EngineStatusInfo>
  } catch {
    return {}
  }
}

export async function notifyEngineServerDeleted(serverId: string): Promise<void> {
  try {
    await fetch(`${ENGINE_URL}/internal/servers/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId }),
      signal: AbortSignal.timeout(2000),
    })
  } catch {
    // engine down → nothing to clean up
  }
}

/** Ask the engine to run a power action (used by scheduled tasks / run-now) */
export async function enginePower(serverId: string, action: 'start' | 'stop' | 'restart' | 'kill'): Promise<void> {
  try {
    await fetch(`${ENGINE_URL}/internal/power`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId, action }),
      signal: AbortSignal.timeout(2000),
    })
  } catch {
    // engine down → action silently skipped
  }
}

/** Ask the engine to run a console command (server must be online) */
export async function engineCommand(serverId: string, command: string): Promise<void> {
  try {
    await fetch(`${ENGINE_URL}/internal/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId, command }),
      signal: AbortSignal.timeout(2000),
    })
  } catch {
    // engine down → command silently skipped
  }
}

/** Push the full schedule list + server configs to the engine's watchdog */
export async function syncSchedules(): Promise<void> {
  try {
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
    await fetch(`${ENGINE_URL}/internal/schedules/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedules: schedules.map((x) => ({
          id: x.id, serverId: x.serverId, everyMin: x.everyMin, action: x.action,
          payload: x.payload, enabled: x.enabled,
          lastRunAt: x.lastRunAt ? x.lastRunAt.getTime() : 0,
        })),
        cfgs,
      }),
      signal: AbortSignal.timeout(2000),
    })
  } catch {
    // engine down → schedules resync on next change
  }
}

export const FALLBACK_STATUS: EngineStatusInfo = {
  status: 'offline' as ServerStatus,
  playersOnline: 0,
  playersMax: 20,
  onlineNames: [],
  uptimeSec: 0,
}

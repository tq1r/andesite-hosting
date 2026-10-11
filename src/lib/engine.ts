// Server-side helper to talk to the mc-engine mini-service (internal, localhost only)
import type { EngineStatusInfo, ServerStatus } from '@/lib/mc'

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

export const FALLBACK_STATUS: EngineStatusInfo = {
  status: 'offline' as ServerStatus,
  playersOnline: 0,
  playersMax: 20,
  onlineNames: [],
  uptimeSec: 0,
}

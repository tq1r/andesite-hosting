'use client'

import { getSocket } from '@/lib/socket'
import type { ServerDTO, LogLine, StatsSample, ServerStatus } from '@/lib/mc'

// ─── Fetch helper ────────────────────────────────────────────────────────────

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

// ─── Engine config mapping ───────────────────────────────────────────────────

export interface EngineConfig {
  id: string
  name: string
  platform: string
  version: string
  motd: string
  maxPlayers: number
  ramMb: number
  port: number
  gamemode: string
  difficulty: string
  plugins?: string[]
}

export function toEngineConfig(s: ServerDTO): EngineConfig {
  return {
    id: s.id,
    name: s.name,
    platform: s.platform,
    version: s.version,
    motd: s.motd,
    maxPlayers: s.maxPlayers,
    ramMb: s.ramMb,
    port: s.port,
    gamemode: s.gamemode,
    difficulty: s.difficulty,
    plugins: s.plugins,
  }
}

export function powerAction(server: ServerDTO, action: 'start' | 'stop' | 'restart' | 'kill') {
  getSocket().emit('power', { serverId: server.id, action, config: toEngineConfig(server) })
}

export function sendCommand(serverId: string, command: string) {
  getSocket().emit('command', { serverId, command })
}

export type { LogLine, StatsSample, ServerStatus }

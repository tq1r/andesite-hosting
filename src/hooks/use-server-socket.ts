'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import type { LogLine, StatsSample, ServerStatus } from '@/lib/mc'

export interface ServerSocketHandlers {
  onLogs?: (lines: LogLine[]) => void
  onLog?: (line: LogLine) => void
  onStatus?: (status: ServerStatus) => void
  onStats?: (sample: StatsSample) => void
  onPlayers?: (names: string[]) => void
}

/**
 * Subscribe to live engine events for one server.
 * Handlers may change between renders without resubscribing (kept in a ref).
 */
export function useServerSocket(serverId: string | null | undefined, handlers: ServerSocketHandlers) {
  const handlersRef = useRef(handlers)

  // keep the latest handlers without resubscribing (latest-ref pattern)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!serverId) return
    const socket = getSocket()

    const emitSubscribe = () => socket.emit('subscribe', { serverId })
    if (socket.connected) emitSubscribe()
    else socket.once('connect', emitSubscribe)

    const onLogs = (d: { serverId: string; lines: LogLine[] }) => {
      if (d.serverId === serverId) handlersRef.current.onLogs?.(d.lines)
    }
    const onLog = (d: { serverId: string; line: LogLine }) => {
      if (d.serverId === serverId) handlersRef.current.onLog?.(d.line)
    }
    const onStatus = (d: { serverId: string; status: ServerStatus }) => {
      if (d.serverId === serverId) handlersRef.current.onStatus?.(d.status)
    }
    const onStats = (d: { serverId: string; sample: StatsSample }) => {
      if (d.serverId === serverId) handlersRef.current.onStats?.(d.sample)
    }
    const onPlayers = (d: { serverId: string; names: string[] }) => {
      if (d.serverId === serverId) handlersRef.current.onPlayers?.(d.names)
    }

    socket.on('logs', onLogs)
    socket.on('log', onLog)
    socket.on('status', onStatus)
    socket.on('stats', onStats)
    socket.on('players', onPlayers)

    return () => {
      socket.off('logs', onLogs)
      socket.off('log', onLog)
      socket.off('status', onStatus)
      socket.off('stats', onStats)
      socket.off('players', onPlayers)
      socket.emit('unsubscribe', { serverId })
    }
  }, [serverId])
}

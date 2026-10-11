'use client'

import { io, type Socket } from 'socket.io-client'

// Live simulation engine URL. Locally this rides the gateway's port-transform
// trick; on serverless deploys (Vercel) set NEXT_PUBLIC_ENGINE_URL to a running
// engine instance, or 'disabled' to skip connecting entirely (panel degrades to
// REST-only mode).
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? '/?XTransformPort=3003'
const ENGINE_DISABLED = process.env.NEXT_PUBLIC_ENGINE_URL === 'disabled'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(ENGINE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: ENGINE_DISABLED ? 0 : Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: !ENGINE_DISABLED,
    })
  }
  return socket
}

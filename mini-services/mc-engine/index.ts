// CraftHost engine — socket.io (3003) + internal HTTP API (3004, for Next.js only)
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { Server, type Socket } from 'socket.io'
import { SimEngine, type RuntimeConfig, type StatsSample } from './sim'

const PORT = 3003
const INTERNAL_PORT = 3004

const httpServer = createServer()

const internalServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = req.url ?? '/'
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'GET' && url === '/health') {
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true, engine: 'mc-engine', uptime: process.uptime() }))
    return
  }
  if (req.method === 'GET' && url === '/internal/statuses') {
    res.writeHead(200)
    res.end(JSON.stringify(engine.allStatuses()))
    return
  }
  if (req.method === 'POST' && url === '/internal/servers/delete') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      try {
        const { serverId } = JSON.parse(body) as { serverId?: string }
        if (serverId) engine.removeServer(serverId)
        res.writeHead(200)
        res.end(JSON.stringify({ ok: true }))
      } catch {
        res.writeHead(400)
        res.end(JSON.stringify({ error: 'bad json' }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'not found' }))
})

const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

const engine = new SimEngine({
  emitLog: (serverId, line) => io.to(room(serverId)).emit('log', { serverId, line }),
  emitStats: (serverId, sample) => io.to(room(serverId)).emit('stats', { serverId, sample }),
  emitPlayers: (serverId, names) => io.to(room(serverId)).emit('players', { serverId, names }),
  broadcastStatus: (serverId) => {
    const info = engine.statusInfo(serverId)
    io.emit('status-changed', {
      serverId,
      status: info.status,
      playersOnline: info.playersOnline,
      playersMax: info.playersMax,
      onlineNames: info.onlineNames,
      uptimeSec: info.uptimeSec,
    })
  },
})

const room = (id: string) => `server:${id}`

interface PowerPayload {
  serverId: string
  action: 'start' | 'stop' | 'restart' | 'kill'
  config?: RuntimeConfig
}

io.on('connection', (socket: Socket) => {
  socket.on('subscribe', ({ serverId }: { serverId: string }) => {
    if (!serverId) return
    socket.join(room(serverId))
    // send current snapshot
    const info = engine.statusInfo(serverId)
    socket.emit('logs', { serverId, lines: engine.getLogs(serverId) })
    socket.emit('status', { serverId, status: info.status })
    socket.emit('players', { serverId, names: info.onlineNames })
    const sample: StatsSample | null = engine.sampleStats(serverId)
    if (sample) socket.emit('stats', { serverId, sample })
  })

  socket.on('unsubscribe', ({ serverId }: { serverId: string }) => {
    if (serverId) socket.leave(room(serverId))
  })

  socket.on('power', (payload: PowerPayload) => {
    if (!payload?.serverId || !payload.action) return
    engine.power(payload.serverId, payload.action, payload.config)
  })

  socket.on('command', ({ serverId, command }: { serverId: string; command: string }) => {
    if (!serverId || !command) return
    engine.command(serverId, command)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[mc-engine] socket.io running on port ${PORT}`)
  internalServer.listen(INTERNAL_PORT, () => {
    console.log(`[mc-engine] internal HTTP API running on port ${INTERNAL_PORT}`)
  })
})

// Andesite engine — socket.io (3003) + internal HTTP API (3004, for Next.js only)
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { Server, type Socket } from 'socket.io'
import { SimEngine, type EngineSchedule, type RuntimeConfig, type StatsSample } from './sim'

const PORT = 3003
const INTERNAL_PORT = 3004

const httpServer = createServer()

const internalServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
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

  const readBody = <T,>(): Promise<T | null> =>
    new Promise((resolve) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        try { resolve(JSON.parse(body) as T) } catch { resolve(null) }
      })
    })

  if (req.method === 'POST' && url === '/internal/power') {
    const body = await readBody<{ serverId?: string; action?: 'start' | 'stop' | 'restart' | 'kill' }>()
    if (!body?.serverId || !body.action) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'serverId and action required' }))
      return
    }
    engine.power(body.serverId, body.action)
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST' && url === '/internal/command') {
    const body = await readBody<{ serverId?: string; command?: string }>()
    if (!body?.serverId || !body.command) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'serverId and command required' }))
      return
    }
    engine.command(body.serverId, body.command)
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST' && url === '/internal/schedules/sync') {
    const body = await readBody<{ schedules?: EngineSchedule[]; cfgs?: Record<string, RuntimeConfig> }>()
    engine.setSchedules(body?.schedules ?? [], body?.cfgs ?? {})
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true, schedules: body?.schedules?.length ?? 0 }))
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
  // bootstrap schedules from the panel (retry until Next.js is up)
  const bootstrap = async (attempt: number) => {
    try {
      const r = await fetch(`http://localhost:3000/api/schedules/engine`, { signal: AbortSignal.timeout(3000) })
      if (!r.ok) throw new Error(`status ${r.status}`)
      const body = (await r.json()) as { schedules: EngineSchedule[]; cfgs: Record<string, RuntimeConfig> }
      engine.setSchedules(body.schedules ?? [], body.cfgs ?? {})
      console.log(`[mc-engine] schedules bootstrap: ${body.schedules?.length ?? 0} task(s) loaded`)
    } catch {
      if (attempt < 10) setTimeout(() => bootstrap(attempt + 1), 4000)
      else console.log('[mc-engine] schedules bootstrap skipped — panel unreachable, will sync on first schedule change')
    }
  }
  setTimeout(() => bootstrap(1), 1500)
})

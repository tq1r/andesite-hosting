// Quick engine integration test: power start → logs → stats → command → stop
import { io } from 'socket.io-client'

const SERVER_ID = process.argv[2]
const socket = io('http://localhost:3003', { path: '/', transports: ['websocket'] })

let logCount = 0
const seen = new Set()

socket.on('connect', () => {
  console.log('[test] connected, subscribing…')
  socket.emit('subscribe', { serverId: SERVER_ID })
  socket.emit('power', {
    serverId: SERVER_ID,
    action: 'start',
    config: {
      id: SERVER_ID, name: 'Blockhaven SMP', platform: 'paper', version: '1.21.4',
      motd: 'test', maxPlayers: 30, ramMb: 8192, port: 25565, gamemode: 'survival', difficulty: 'normal',
    },
  })
})

socket.on('logs', (d) => { logCount += d.lines.length })
socket.on('log', (d) => {
  logCount++
  if (d.line.msg.includes('Done') || d.line.msg.includes('joined the game') || d.line.msg.includes('left the game')) {
    seen.add(d.line.msg.slice(0, 40))
    console.log('[log]', d.line.lvl, d.line.msg.slice(0, 70))
  }
})
socket.on('status-changed', (d) => console.log('[status]', d.serverId?.slice(-6), d.status, 'players:', d.playersOnline))
socket.on('stats', (d) => { if (!seen.has('stats')) { seen.add('stats'); console.log('[stats] cpu:', d.sample.cpu.toFixed(1), 'ram:', d.sample.ramMb, 'tps:', d.sample.tps) } })

setTimeout(() => {
  console.log('[test] sending command: list')
  socket.emit('command', { serverId: SERVER_ID, command: 'list' })
  socket.emit('command', { serverId: SERVER_ID, command: 'say Hello from panel test' })
}, 9000)

setTimeout(() => {
  console.log(`[test] done. total logs: ${logCount}`)
  socket.emit('power', { serverId: SERVER_ID, action: 'stop' })
  setTimeout(() => {
    console.log('[test] stop issued, exiting')
    process.exit(0)
  }, 2500)
}, 14000)

socket.on('connect_error', (e) => {
  console.error('[test] connect error:', e.message)
  process.exit(1)
})

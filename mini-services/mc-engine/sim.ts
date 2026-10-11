// CraftHost engine — Minecraft server simulation core
// In-memory runtimes: boot sequence, live events, metrics, command handling

export type ServerStatus = 'offline' | 'starting' | 'online' | 'stopping'
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CHAT' | 'CMD'

export interface LogLine {
  t: number
  lvl: LogLevel
  th: string
  msg: string
}

export interface StatsSample {
  cpu: number
  ramPct: number
  ramMb: number
  ramTotalMb: number
  tps: number
  players: number
  playersMax: number
  netIn: number
  netOut: number
  uptimeSec: number
}

export interface RuntimeConfig {
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
}

export interface EngineStatusInfo {
  status: ServerStatus
  playersOnline: number
  playersMax: number
  onlineNames: string[]
  uptimeSec: number
}

interface OnlinePlayer {
  name: string
  uuid: string
  joinedAt: number
}

interface Runtime {
  cfg: RuntimeConfig
  status: ServerStatus
  logs: LogLine[]
  online: Map<string, OnlinePlayer>
  seed: string
  startedAt: number | null
  cpuSpike: number
  timers: ReturnType<typeof setTimeout>[]
  intervals: ReturnType<typeof setInterval>[]
  lastSave: number
  restartAfterStop: boolean
  destroyed: boolean
}

// ─── Pools ───────────────────────────────────────────────────────────────────

const NAME_POOL = [
  'Steve', 'Alex', 'Notch', 'Jeb_', 'Dinnerbone', 'Grumm', 'Herobrine',
  'Dream', 'GeorgeNotFound', 'Sapnap', 'Callahan', 'CaptainSparklez',
  'Grian', 'MumboJumbo', 'Iskall85', 'Keralis', 'Xisuma', 'Etho',
  'Bdubs', 'Zedaph', 'TangoTek', 'ImpulseSV', 'Skizzleman', 'GoodTimesWithScar',
  'StressMonster', 'FalseSymmetry', 'cubfan135', 'hypnotizd', 'joehills', 'TinfoilChef',
  'K1ttyPvP', 'xXSniperXx', 'PixelPirate', 'RedstoneRay', 'EnderQueen', 'CreeperHunter99',
]

const CHAT_POOL = [
  'anyone got spare diamonds?', 'lol', 'check out my base, its huge',
  'who took my stuff from the chest??', 'brb dinner', 'gg',
  'anyone wanna build a mob farm?', 'a creeper almost blew me up just now',
  'selling diamonds 5d each, dm me', 'this server runs so smooth',
  'can someone tp me to spawn?', 'new here, whats the seed?',
  'wanna trade? i have netherite', 'just found a village with 2 blacksmiths!',
  'nether trip anyone? i need blaze rods', 'my dog died to a zombie :(',
  'almost done with my netherite set', 'someone griefed my house!! admin?',
  'can we set it to day pls', 'building a castle at spawn, come see',
  'i fell in lava AGAIN', 'look at my skin lol',
]

const DEATH_MESSAGES = [
  'was slain by Zombie', 'was shot by Skeleton', 'was blown up by Creeper',
  'hit the ground too hard', 'drowned while trying to escape', 'was pricked to death',
  'was squashed by a falling anvil', 'fell from a high place', 'was slain by Ender Man',
  'was roasted by Blaze', 'tried to swim in lava',
]

const PVP_DEATHS = ['was slain by {p} using [Diamond Sword]', 'was slain by {p} using [Netherite Sword]', 'was shot by {p} using [Bow]']

const ADVANCEMENTS = [
  'Getting Wood', 'Getting an Upgrade', 'Diamonds!', 'We Need to Go Deeper',
  'Ice Bucket Challenge', 'Sweet Dreams', 'The Parrots and the Bats',
  'Bake Bread', 'On A Rail', 'Cover Me With Diamonds', 'Sniper Duel',
]

const REACT_POOL = ['lol', 'ok', 'o/', 'hi server', 'understood', 'lol what', 'noted']

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rnd = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const uuid = () => {
  const h = '0123456789abcdef'
  const seg = (len: number) => Array.from({ length: len }, () => h[Math.floor(Math.random() * 16)]).join('')
  return `${seg(8)}-${seg(4)}-4${seg(3)}-a${seg(3)}-${seg(12)}`
}
const platformLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1)
const supportsPlugins = (p: string) => p !== 'vanilla'

export interface EngineHooks {
  emitLog: (serverId: string, line: LogLine) => void
  emitStats: (serverId: string, sample: StatsSample) => void
  emitPlayers: (serverId: string, names: string[]) => void
  broadcastStatus: (serverId: string) => void
}

export class SimEngine {
  private runtimes = new Map<string, Runtime>()
  constructor(private hooks: EngineHooks) {}

  // ─── Public API ────────────────────────────────────────────────────────────

  power(serverId: string, action: 'start' | 'stop' | 'restart' | 'kill', cfg?: RuntimeConfig) {
    const rt = this.runtimes.get(serverId)
    if (action === 'kill') {
      if (rt) this.kill(rt)
      return
    }
    if (action === 'start') {
      if (rt && rt.status !== 'offline') return
      this.start(cfg!)
      return
    }
    if (action === 'restart') {
      if (!rt || rt.status === 'offline') {
        if (cfg) this.start(cfg)
        return
      }
      rt.restartAfterStop = true
      this.stop(rt)
      return
    }
    if (action === 'stop') {
      if (!rt || rt.status === 'offline') return
      rt.restartAfterStop = false
      this.stop(rt)
    }
  }

  command(serverId: string, raw: string) {
    const rt = this.runtimes.get(serverId)
    if (!rt || rt.status === 'offline' || rt.status === 'stopping') return
    this.runCommand(rt, raw)
  }

  getLogs(serverId: string, max = 300): LogLine[] {
    const rt = this.runtimes.get(serverId)
    if (!rt) return []
    return rt.logs.slice(-max)
  }

  statusInfo(serverId: string): EngineStatusInfo {
    const rt = this.runtimes.get(serverId)
    if (!rt) {
      return { status: 'offline', playersOnline: 0, playersMax: 0, onlineNames: [], uptimeSec: 0 }
    }
    return {
      status: rt.status,
      playersOnline: rt.online.size,
      playersMax: rt.cfg.maxPlayers,
      onlineNames: Array.from(rt.online.keys()),
      uptimeSec: rt.startedAt ? Math.floor((Date.now() - rt.startedAt) / 1000) : 0,
    }
  }

  allStatuses(): Record<string, EngineStatusInfo> {
    const out: Record<string, EngineStatusInfo> = {}
    for (const id of this.runtimes.keys()) out[id] = this.statusInfo(id)
    return out
  }

  removeServer(serverId: string) {
    const rt = this.runtimes.get(serverId)
    if (rt) {
      this.clearTimers(rt)
      rt.destroyed = true
    }
    this.runtimes.delete(serverId)
  }

  sampleStats(serverId: string): StatsSample | null {
    const rt = this.runtimes.get(serverId)
    if (!rt) return null
    return this.sample(rt)
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  private start(cfg: RuntimeConfig) {
    const rt: Runtime = {
      cfg,
      status: 'starting',
      logs: [],
      online: new Map(),
      seed: `${Math.floor(rnd(-9_000_000_000_000_000, 9_000_000_000_000_000))}`,
      startedAt: null,
      cpuSpike: 0,
      timers: [],
      intervals: [],
      lastSave: Date.now(),
      restartAfterStop: false,
      destroyed: false,
    }
    this.runtimes.set(cfg.id, rt)
    this.hooks.broadcastStatus(cfg.id)

    const after = (ms: number, fn: () => void) => {
      rt.timers.push(setTimeout(() => { if (!rt.destroyed) fn() }, ms))
    }
    const log = (lvl: LogLevel, msg: string, th = 'Server thread') => this.pushLog(rt, lvl, msg, th)

    log('INFO', `Starting minecraft server version ${cfg.version}`)
    after(320, () => log('INFO', 'Loading properties'))
    after(560, () => log('INFO', `Default game type: ${cfg.gamemode.toUpperCase()}`))
    if (cfg.platform !== 'vanilla') {
      after(820, () => log('INFO', `This server is running ${platformLabel(cfg.platform)} version ${cfg.version}-214 (MC: ${cfg.version}) (Implementing API version ${cfg.version}-R0.1-SNAPSHOT)`))
    }
    after(1050, () => log('INFO', `Server permissions file permissions.yml is empty, defaulting to vanilla-style permissions`))
    after(1250, () => log('INFO', `Preparing level "world"`))
    after(1550, () => log('INFO', 'Preparing start region for dimension minecraft:overworld'))
    let area = 0
    const steps: Array<[number, number]> = [[350, 14], [650, 37], [950, 61], [1250, 83], [1500, 96]]
    for (const [ms, pct] of steps) {
      after(1550 + ms, () => {
        area = pct
        log('INFO', `Preparing spawn area: ${area}%`)
      })
    }
    after(3300, () => log('INFO', 'Preparing spawn area: 99%'))
    after(3550, () => log('INFO', `Time elapsed: ${Math.floor(rnd(2100, 3400))} ms`))
    after(3850, () => {
      log('INFO', `Done (${rnd(3.2, 5.4).toFixed(3)}s)! For help, type "help"`)
      this.markOnline(rt)
    })
  }

  private markOnline(rt: Runtime) {
    rt.status = 'online'
    rt.startedAt = Date.now()
    this.hooks.broadcastStatus(rt.cfg.id)

    // metrics every 2s
    rt.intervals.push(setInterval(() => {
      if (rt.destroyed || rt.status !== 'online') return
      this.hooks.emitStats(rt.cfg.id, this.sample(rt))
    }, 2000))

    // world event loop every 4s
    rt.intervals.push(setInterval(() => {
      if (rt.destroyed || rt.status !== 'online') return
      this.tick(rt)
    }, 4000))

    // welcome joins shortly after boot
    const firstJoin = 2500 + Math.floor(rnd(0, 4000))
    rt.timers.push(setTimeout(() => {
      if (!rt.destroyed && rt.status === 'online') this.tryJoin(rt)
    }, firstJoin))
  }

  private stop(rt: Runtime, reason = 'Stopping the server') {
    if (rt.status === 'stopping' || rt.status === 'offline') return
    rt.status = 'stopping'
    this.clearEventing(rt)
    this.hooks.broadcastStatus(rt.cfg.id)
    const after = (ms: number, fn: () => void) => {
      rt.timers.push(setTimeout(() => { if (!rt.destroyed) fn() }, ms))
    }
    const log = (lvl: LogLevel, msg: string, th = 'Server thread') => this.pushLog(rt, lvl, msg, th)
    log('INFO', reason)
    after(150, () => log('INFO', 'Saving chunks'))
    after(450, () => log('INFO', 'Saving worlds'))
    after(950, () => log('INFO', 'ThreadedAnvilChunkStorage (world): All dimensions are saved'))
    after(1250, () => this.markOffline(rt))
  }

  private kill(rt: Runtime) {
    this.pushLog(rt, 'WARN', 'Server process killed by operator (SIGKILL)', 'Watchdog')
    this.markOffline(rt)
  }

  private markOffline(rt: Runtime) {
    this.clearTimers(rt)
    rt.status = 'offline'
    rt.online.clear()
    rt.startedAt = null
    this.hooks.emitPlayers(rt.cfg.id, [])
    this.hooks.broadcastStatus(rt.cfg.id)
    if (rt.restartAfterStop && !rt.destroyed) {
      rt.restartAfterStop = false
      const cfg = rt.cfg
      this.start(cfg)
    }
  }

  private clearTimers(rt: Runtime) {
    this.clearEventing(rt)
    for (const t of rt.timers) clearTimeout(t)
    rt.timers = []
  }

  private clearEventing(rt: Runtime) {
    for (const i of rt.intervals) clearInterval(i)
    rt.intervals = []
  }

  // ─── World simulation ──────────────────────────────────────────────────────

  private tick(rt: Runtime) {
    rt.cpuSpike = Math.max(0, rt.cpuSpike - 8)

    if (rt.online.size > 0 && Math.random() < 0.30) this.tryChat(rt)
    if (rt.online.size < rt.cfg.maxPlayers && rt.online.size < 12 && Math.random() < 0.20) this.tryJoin(rt)
    if (rt.online.size > 0 && Math.random() < 0.10) this.tryLeave(rt)
    if (rt.online.size > 0 && Math.random() < 0.06) this.tryDeath(rt)
    if (rt.online.size > 0 && Math.random() < 0.05) this.tryAdvancement(rt)
    if (rt.online.size > 4 && Math.random() < 0.04) {
      const behind = Math.floor(rnd(1000, 2600))
      this.pushLog(rt, 'WARN', `Can't keep up! Is the server overloaded? Running ${behind}ms or ${Math.floor(behind / 50)} ticks behind`, 'Server thread')
    }
    if (Date.now() - rt.lastSave > 300_000 && rt.online.size > 0) {
      rt.lastSave = Date.now()
      this.pushLog(rt, 'INFO', 'Saving the game (this may take a moment!)')
      rt.timers.push(setTimeout(() => {
        if (!rt.destroyed && rt.status === 'online') this.pushLog(rt, 'INFO', 'Saved the game')
      }, 900))
    }
  }

  private tryJoin(rt: Runtime) {
    const candidates = NAME_POOL.filter((n) => !rt.online.has(n))
    if (!candidates.length) return
    const name = pick(candidates)
    const id = uuid()
    this.pushLog(rt, 'INFO', `UUID of player ${name} is ${id}`, 'User Authenticator #1')
    rt.online.set(name, { name, uuid: id, joinedAt: Date.now() })
    rt.cpuSpike += rnd(12, 26)
    this.pushLog(rt, 'INFO', `${name} joined the game`)
    this.hooks.emitPlayers(rt.cfg.id, Array.from(rt.online.keys()))
    this.hooks.broadcastStatus(rt.cfg.id)
  }

  private tryLeave(rt: Runtime) {
    const name = pick(Array.from(rt.online.keys()))
    if (!name) return
    rt.online.delete(name)
    this.pushLog(rt, 'INFO', `${name} left the game`)
    this.hooks.emitPlayers(rt.cfg.id, Array.from(rt.online.keys()))
    this.hooks.broadcastStatus(rt.cfg.id)
  }

  private tryChat(rt: Runtime) {
    const name = pick(Array.from(rt.online.keys()))
    this.pushLog(rt, 'CHAT', `<${name}> ${pick(CHAT_POOL)}`, 'Async Chat Thread - #0')
  }

  private tryDeath(rt: Runtime) {
    const name = pick(Array.from(rt.online.keys()))
    const others = Array.from(rt.online.keys()).filter((n) => n !== name)
    let msg = pick(DEATH_MESSAGES)
    if (msg.includes('{p}')) {
      if (others.length) msg = msg.replace('{p}', pick(others))
      else msg = pick(DEATH_MESSAGES.filter((m) => !m.includes('{p}')))
    }
    this.pushLog(rt, 'INFO', `${name} ${msg}`)
  }

  private tryAdvancement(rt: Runtime) {
    const name = pick(Array.from(rt.online.keys()))
    this.pushLog(rt, 'INFO', `${name} has made the advancement [${pick(ADVANCEMENTS)}]`)
  }

  private pushLog(rt: Runtime, lvl: LogLevel, msg: string, th = 'Server thread') {
    const line: LogLine = { t: Date.now(), lvl, th, msg }
    rt.logs.push(line)
    if (rt.logs.length > 400) rt.logs.splice(0, rt.logs.length - 400)
    this.hooks.emitLog(rt.cfg.id, line)
  }

  private sample(rt: Runtime): StatsSample {
    const p = rt.online.size
    const cpu = Math.min(96, Math.max(2, 6 + p * 2.6 + rnd(-2.5, 3.5) + rt.cpuSpike))
    const ramPct = Math.min(88, 32 + p * 2.4 + rnd(-1.5, 2.5))
    const tps = p > 5 && Math.random() < 0.12 ? rnd(18.1, 19.4) : rnd(19.6, 20.0)
    return {
      cpu,
      ramPct,
      ramMb: Math.round((ramPct / 100) * rt.cfg.ramMb),
      ramTotalMb: rt.cfg.ramMb,
      tps,
      players: p,
      playersMax: rt.cfg.maxPlayers,
      netIn: Math.round(14 + p * 12 + rnd(0, 30)),
      netOut: Math.round(22 + p * 28 + rnd(0, 60)),
      uptimeSec: rt.startedAt ? Math.floor((Date.now() - rt.startedAt) / 1000) : 0,
    }
  }

  // ─── Console commands ──────────────────────────────────────────────────────

  private runCommand(rt: Runtime, raw: string) {
    const line = raw.trim().replace(/^\//, '')
    if (!line) return
    const parts = line.split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)
    const rest = line.slice(parts[0].length).trim()
    const log = (lvl: LogLevel, msg: string, th = 'Server thread') => this.pushLog(rt, lvl, msg, th)
    const onlineNames = () => Array.from(rt.online.keys())

    switch (cmd) {
      case 'help':
        log('CMD', '--- Showing help ---')
        ;[
          '/help — show this help', '/list — list online players', '/say <msg> — broadcast a message',
          '/kick <player> [reason]', '/ban <player>', '/pardon <player>', '/op <player>', '/deop <player>',
          '/whitelist <on|off|list|add|remove> [player]', '/gamemode <mode> [player]', '/tp <player> <player>',
          '/time set <day|night|noon|midnight|n>', '/weather <clear|rain|thunder>', '/difficulty <level>',
          '/save-all — save the world', '/seed — show world seed', '/tps — ticks per second',
          '/plugins — list plugins', '/version — server version', '/stop — shut the server down',
        ].forEach((l) => log('CMD', l))
        break
      case 'list':
        log('INFO', `There are ${rt.online.size} of a max of ${rt.cfg.maxPlayers} players online: ${onlineNames().join(', ')}`)
        break
      case 'say': {
        if (!rest) { log('WARN', 'Usage: /say <message>'); break }
        log('INFO', `[Server] ${rest}`)
        if (rt.online.size && Math.random() < 0.35) {
          const name = pick(onlineNames())
          rt.timers.push(setTimeout(() => {
            if (!rt.destroyed && rt.status === 'online') this.pushLog(rt, 'CHAT', `<${name}> ${pick(REACT_POOL)}`, 'Async Chat Thread - #0')
          }, 1200 + Math.floor(rnd(0, 2500))))
        }
        break
      }
      case 'me':
        if (!rest) { log('WARN', 'Usage: /me <action>'); break }
        log('INFO', `* Console ${rest}`)
        break
      case 'tell': case 'msg': case 'w': {
        const target = args[0]
        const msg = rest.slice(target?.length ?? 0).trim()
        if (!target || !msg) { log('WARN', 'Usage: /tell <player> <message>'); break }
        if (!rt.online.has(target)) { log('WARN', `That player cannot be found`); break }
        log('INFO', `You whisper to ${target}: ${msg}`)
        break
      }
      case 'kick': {
        const target = args[0]
        if (!target) { log('WARN', 'Usage: /kick <player> [reason]'); break }
        if (!rt.online.has(target)) { log('WARN', `That player is not online`); break }
        rt.online.delete(target)
        log('INFO', `${target} lost connection: Kicked by an operator${args[1] ? `: ${args.slice(1).join(' ')}` : ''}`)
        this.hooks.emitPlayers(rt.cfg.id, onlineNames())
        this.hooks.broadcastStatus(rt.cfg.id)
        break
      }
      case 'ban': {
        const target = args[0]
        if (!target) { log('WARN', 'Usage: /ban <player>'); break }
        log('INFO', `${target} banned by console: Banned by an operator.`)
        if (rt.online.has(target)) {
          rt.online.delete(target)
          log('INFO', `${target} lost connection: You are banned from this server`)
          this.hooks.emitPlayers(rt.cfg.id, onlineNames())
          this.hooks.broadcastStatus(rt.cfg.id)
        }
        break
      }
      case 'pardon': case 'unban': {
        const target = args[0]
        if (!target) { log('WARN', 'Usage: /pardon <player>'); break }
        log('INFO', `Unbanned ${target}`)
        break
      }
      case 'op': case 'deop': {
        const target = args[0]
        if (!target) { log('WARN', `Usage: /${cmd} <player>`); break }
        log('INFO', cmd === 'op' ? `Made ${target} a server operator` : `Made ${target} no longer a server operator`)
        break
      }
      case 'whitelist': {
        const sub = (args[0] ?? '').toLowerCase()
        if (sub === 'list') {
          log('INFO', `There are 0 whitelisted players: `)
        } else if (sub === 'on' || sub === 'off') {
          log('INFO', `Turned ${sub} the whitelist`)
        } else if (sub === 'add' || sub === 'remove') {
          const target = args[1]
          if (!target) { log('WARN', `Usage: /whitelist ${sub} <player>`); break }
          log('INFO', sub === 'add' ? `Added ${target} to the whitelist` : `Removed ${target} from the whitelist`)
        } else {
          log('WARN', 'Usage: /whitelist <on|off|list|add|remove> [player]')
        }
        break
      }
      case 'gamemode': case 'gm': {
        const map: Record<string, string> = { s: 'survival', survival: 'survival', c: 'creative', creative: 'creative', a: 'adventure', adventure: 'adventure', sp: 'spectator', spectator: 'spectator' }
        const mode = map[(args[0] ?? '').toLowerCase()]
        const target = args[1]
        if (!mode) { log('WARN', 'Usage: /gamemode <survival|creative|adventure|spectator> [player]'); break }
        if (target && !rt.online.has(target)) { log('WARN', `That player is not online`); break }
        log('INFO', `Set ${target ?? 'own'}'s game mode to ${mode.charAt(0).toUpperCase()}${mode.slice(1)} Mode`)
        break
      }
      case 'tp': case 'teleport': {
        const [a, b] = args
        if (!a || !b) { log('WARN', 'Usage: /tp <player> <player>'); break }
        if (!rt.online.has(a) || !rt.online.has(b)) { log('WARN', `That player cannot be found`); break }
        log('INFO', `Teleported ${a} to ${b}`)
        break
      }
      case 'time': {
        if (args[0]?.toLowerCase() !== 'set' || !args[1]) { log('WARN', 'Usage: /time set <day|night|noon|midnight|ticks>'); break }
        const map: Record<string, number> = { day: 1000, noon: 6000, night: 13000, midnight: 18000 }
        const v = map[args[1].toLowerCase()] ?? (Number(args[1]) >= 0 ? Number(args[1]) : NaN)
        if (Number.isNaN(v)) { log('WARN', 'Invalid time. Try day, night, noon or midnight'); break }
        log('INFO', `Set the time to ${v}`)
        break
      }
      case 'weather': {
        const w = args[0]?.toLowerCase()
        if (w !== 'clear' && w !== 'rain' && w !== 'thunder') { log('WARN', 'Usage: /weather <clear|rain|thunder>'); break }
        log('INFO', `Set the weather to ${w}`)
        break
      }
      case 'difficulty': {
        const d = args[0]?.toLowerCase()
        if (!['peaceful', 'easy', 'normal', 'hard'].includes(d ?? '')) { log('WARN', 'Usage: /difficulty <peaceful|easy|normal|hard>'); break }
        log('INFO', `Set the difficulty level to ${d}`)
        break
      }
      case 'save-all': case 'save-all flush':
        log('INFO', 'Saving the game (this may take a moment!)')
        rt.timers.push(setTimeout(() => { if (!rt.destroyed && rt.status === 'online') this.pushLog(rt, 'INFO', 'Saved the game') }, 900))
        break
      case 'seed':
        log('INFO', `Seed: [${rt.seed}]`)
        break
      case 'tps':
        log('INFO', `TPS from last 1m, 5m, 15m: ${(rnd(19.7, 20)).toFixed(2)}, ${(rnd(19.6, 20)).toFixed(2)}, ${(rnd(19.5, 20)).toFixed(2)}`)
        break
      case 'plugins': case 'pl':
        if (!supportsPlugins(rt.cfg.platform)) { log('WARN', 'This server does not support plugins (vanilla). Try Fabric or Forge for mods.'); break }
        log('INFO', `Plugins (3): EssentialsX, LuckPerms, WorldEdit`)
        break
      case 'version': case 'about':
        log('INFO', rt.cfg.platform === 'vanilla'
          ? `This server is running vanilla version ${rt.cfg.version}`
          : `This server is running ${platformLabel(rt.cfg.platform)} version ${rt.cfg.version} (MC: ${rt.cfg.version})`)
        break
      case 'stop':
        this.stop(rt)
        break
      default:
        log('ERROR', `Unknown command. Type "help" for help.`)
    }
  }
}

// ─── CraftHost shared constants & types (client-safe) ────────────────────────

export type ServerStatus = 'offline' | 'starting' | 'online' | 'stopping'
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CHAT' | 'CMD'

export interface LogLine {
  t: number // epoch ms
  lvl: LogLevel
  th: string // thread label e.g. "Server thread"
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
  netIn: number // kbps
  netOut: number
  uptimeSec: number
}

export interface EngineStatusInfo {
  status: ServerStatus
  playersOnline: number
  playersMax: number
  onlineNames: string[]
  uptimeSec: number
}

export interface ServerDTO {
  id: string
  name: string
  platform: string
  version: string
  motd: string
  maxPlayers: number
  ramMb: number
  port: number
  region: string
  gamemode: string
  difficulty: string
  worldType: string
  pvp: boolean
  onlineMode: boolean
  whitelist: boolean
  createdAt: string
  updatedAt: string
  playerCount: number
  backupCount: number
  status: ServerStatus
  playersOnline: number
  uptimeSec: number
}

export interface PlayerDTO {
  id: string
  name: string
  uuid: string
  isOp: boolean
  isBanned: boolean
  isWhitelisted: boolean
  joins: number
  playTimeMin: number
  lastSeen: string
  isOnline?: boolean
}

export interface FileNodeDTO {
  id: string
  parentId: string | null
  name: string
  isDir: boolean
  size: number
  content: string | null
  updatedAt: string
}

export interface BackupDTO {
  id: string
  name: string
  sizeMb: number
  createdAt: string
}

export interface ActivityDTO {
  id: string
  type: string
  message: string
  serverName: string | null
  createdAt: string
}

// ─── Catalog data ────────────────────────────────────────────────────────────

export const PLATFORMS = [
  { id: 'vanilla', label: 'Vanilla', desc: 'Official Mojang server. Pure, unmodified gameplay.', pluginSupport: false },
  { id: 'paper', label: 'Paper', desc: 'High-performance fork with plugin support. The community favorite.', pluginSupport: true },
  { id: 'spigot', label: 'Spigot', desc: 'Classic plugin server. battle-tested by thousands of networks.', pluginSupport: true },
  { id: 'fabric', label: 'Fabric', desc: 'Lightweight modding platform for modern versions.', pluginSupport: true },
  { id: 'forge', label: 'Forge', desc: 'The heavyweight mod loader. Build giant modpacks.', pluginSupport: true },
] as const

export const VERSIONS = [
  { id: '1.21.4', label: '1.21.4 (latest)' },
  { id: '1.21.1', label: '1.21.1' },
  { id: '1.20.6', label: '1.20.6' },
  { id: '1.20.4', label: '1.20.4' },
  { id: '1.19.4', label: '1.19.4' },
  { id: '1.18.2', label: '1.18.2' },
  { id: '1.16.5', label: '1.16.5' },
  { id: '1.12.2', label: '1.12.2 (mods classic)' },
  { id: '1.8.8', label: '1.8.8 (PvP classic)' },
]

export const REGIONS = [
  { id: 'us-east', label: 'US East — Ashburn', ping: 12 },
  { id: 'us-west', label: 'US West — Los Angeles', ping: 38 },
  { id: 'eu-central', label: 'EU Central — Frankfurt', ping: 84 },
  { id: 'eu-west', label: 'EU West — London', ping: 96 },
  { id: 'ap-south', label: 'Asia — Singapore', ping: 212 },
  { id: 'ap-northeast', label: 'Asia — Tokyo', ping: 148 },
]

export const GAMEMODES = [
  { id: 'survival', label: 'Survival' },
  { id: 'creative', label: 'Creative' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'spectator', label: 'Spectator' },
]

export const DIFFICULTIES = [
  { id: 'peaceful', label: 'Peaceful' },
  { id: 'easy', label: 'Easy' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Hard' },
]

export const WORLD_TYPES = [
  { id: 'normal', label: 'Normal' },
  { id: 'flat', label: 'Superflat' },
  { id: 'large_biomes', label: 'Large Biomes' },
  { id: 'amplified', label: 'Amplified' },
]

export const PLANS = [
  {
    id: 'dirt',
    name: 'Dirt',
    ramMb: 2048,
    price: 0,
    priceLabel: 'Free',
    period: 'forever',
    tagline: 'Play with a few friends',
    slots: '5–10 players',
    features: ['2 GB DDR4 RAM', '10 GB NVMe storage', 'Instant setup', 'Console + file manager', 'Daily backups'],
    highlight: false,
  },
  {
    id: 'iron',
    name: 'Iron',
    ramMb: 4096,
    price: 3.49,
    priceLabel: '$3.49',
    period: '/month',
    tagline: 'Small survival servers',
    slots: '10–25 players',
    features: ['4 GB DDR4 RAM', '25 GB NVMe storage', 'Plugin / mod support', 'Free subdomain', 'Hourly backups'],
    highlight: false,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    ramMb: 8192,
    price: 6.99,
    priceLabel: '$6.99',
    period: '/month',
    tagline: 'Most popular for SMPs',
    slots: '25–60 players',
    features: ['8 GB DDR4 RAM', '60 GB NVMe storage', 'All platforms + mods', 'Priority support', 'Hourly backups', 'Free dedicated IP'],
    highlight: true,
  },
  {
    id: 'netherite',
    name: 'Netherite',
    ramMb: 16384,
    price: 12.99,
    priceLabel: '$12.99',
    period: '/month',
    tagline: 'Huge communities',
    slots: '60–200 players',
    features: ['16 GB DDR4 RAM', '150 GB NVMe storage', 'Dedicated vCores ×4', 'Advanced DDoS shield', 'Custom jar support'],
    highlight: false,
  },
]

export const NAME_POOL = [
  'Steve', 'Alex', 'Notch', 'Jeb_', 'Dinnerbone', 'Grumm', 'Herobrine',
  'Dream', 'GeorgeNotFound', 'Sapnap', 'Callahan', 'CaptainSparklez',
  'Grian', 'MumboJumbo', 'Iskall85', 'Keralis', 'Xisuma', 'Etho',
  'Bdubs', 'Zedaph', 'TangoTek', 'ImpulseSV', 'Skizzleman', 'GoodTimesWithScar',
  'StressMonster', 'FalseSymmetry', 'cubfan135', 'hypnotizd', 'joehills', 'TinfoilChef',
  'K1ttyPvP', 'xXSniperXx', 'PixelPirate', 'RedstoneRay', 'EnderQueen', 'CreeperHunter99',
]

export const CHAT_POOL = [
  'anyone got spare diamonds?',
  'lol',
  'check out my base, its huge',
  'who took my stuff from the chest??',
  'brb dinner',
  'gg',
  'anyone wanna build a mob farm?',
  'a creeper almost blew me up just now',
  'selling diamonds 5d each, dm me',
  'this server runs so smooth',
  'can someone tp me to spawn?',
  'new here, whats the seed?',
  'wanna trade? i have netherite',
  'just found a village with 2 blacksmiths!',
  'nether trip anyone? i need blaze rods',
  'my dog died to a zombie :(',
  'almost done with my netherite set',
  'someone griefed my house!! admin?',
  'can we set it to day pls',
  'building a castle at spawn, come see',
  'anyone else hear that sound?',
  'i fell in lava AGAIN',
  'who wants to fight the ender dragon this weekend?',
  'brb chopping wood',
  'look at my skin lol',
]

export const DEATH_MESSAGES = [
  'was slain by Zombie',
  'was shot by Skeleton',
  'was blown up by Creeper',
  'hit the ground too hard',
  'drowned while trying to escape a Drowned',
  'was pricked to death',
  'was squashed by a falling anvil',
  'fell from a high place',
  'was slain by Ender Man',
  'was roasted by Blaze',
  'tried to swim in lava',
  'was slain by {player} using [Diamond Sword]',
  'was slain by {player} using [Netherite Sword]',
]

export const ADVANCEMENTS = [
  'Getting Wood', 'Getting an Upgrade', 'Diamonds!', 'We Need to Go Deeper',
  'Ice Bucket Challenge', 'Sweet Dreams', 'The Parrots and the Bats',
  'Bake Bread', 'On A Rail', 'Cover Me With Diamonds', 'Sniper Duel',
]

export const SERVER_NAME_IDEAS = [
  'Angry Creepers SMP', 'Pixel Palace', 'Redstone Labs', 'Ender Empire',
  'Blockhaven', 'Diamond Depot', 'Nether Nexus', 'Emerald Isle',
  'Obsidian Order', 'Golden Golems', 'Creeper Café', 'Skyblock Central',
  'The Overworld', 'Void Ventures', 'Mossy Meadows', 'TNT Town',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function ramLabel(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${mb} MB`
}

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function uptimeLabel(sec: number): string {
  if (sec <= 0) return '—'
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export const STATUS_META: Record<ServerStatus, { label: string; dot: string; badge: string }> = {
  offline: { label: 'Offline', dot: 'bg-zinc-500', badge: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  starting: { label: 'Starting', dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60' },
  online: { label: 'Online', dot: 'bg-emerald-400', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' },
  stopping: { label: 'Stopping', dot: 'bg-orange-400 animate-pulse', badge: 'bg-orange-950/60 text-orange-300 border-orange-800/60' },
}

export function serverAddress(s: { port: number }): string {
  return `play.crafthost.gg:${s.port}`
}

export function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id
}

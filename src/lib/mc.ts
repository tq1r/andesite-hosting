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
  plugins: string[]
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

export interface ScheduleDTO {
  id: string
  serverId: string
  name: string
  everyMin: number
  action: 'backup' | 'restart' | 'command'
  payload: string | null
  enabled: boolean
  lastRunAt: string | null
  lastResult: string | null
  createdAt: string
}

export interface ActivityDTO {
  id: string
  type: string
  message: string
  serverName: string | null
  createdAt: string
}

// Catalog data — versions verified against Mojang piston-meta manifest,
// PaperMC (fill.papermc.io v3), Fabric meta & NeoForge maven, Oct 2026.
// Since 26.1 Minecraft uses calendar-year versioning ("26" = 2026).
export const LATEST_VERSION = '26.3'
export const LATEST_DROP = 'Wilderness Bound'

export const PLATFORMS = [
  { id: 'vanilla', label: 'Vanilla', desc: 'Official Mojang server. Pure, unmodified gameplay.', pluginSupport: false },
  { id: 'paper', label: 'Paper', desc: 'High-performance fork with plugin support. The community favorite.', pluginSupport: true },
  { id: 'spigot', label: 'Spigot', desc: 'Classic plugin server. battle-tested by thousands of networks.', pluginSupport: true },
  { id: 'fabric', label: 'Fabric', desc: 'Lightweight modding platform for modern versions.', pluginSupport: true },
  { id: 'forge', label: 'Forge', desc: 'The heavyweight mod loader (NeoForge on 26.x). Build giant modpacks.', pluginSupport: true },
] as const

export interface VersionEntry {
  id: string
  label: string
  note?: string // game drop name / era note
}

export const VERSIONS: VersionEntry[] = [
  { id: '26.3', label: '26.3', note: 'Wilderness Bound · latest release' },
  { id: '26.2', label: '26.2', note: 'Chaos Cubed' },
  { id: '26.1.2', label: '26.1.2', note: 'Tiny Takeover' },
  { id: '1.21.11', label: '1.21.11' },
  { id: '1.21.10', label: '1.21.10' },
  { id: '1.21.9', label: '1.21.9' },
  { id: '1.21.8', label: '1.21.8' },
  { id: '1.21.4', label: '1.21.4' },
  { id: '1.20.6', label: '1.20.6' },
  { id: '1.20.4', label: '1.20.4' },
  { id: '1.19.4', label: '1.19.4' },
  { id: '1.18.2', label: '1.18.2' },
  { id: '1.16.5', label: '1.16.5' },
  { id: '1.12.2', label: '1.12.2', note: 'mods classic' },
  { id: '1.8.8', label: '1.8.8', note: 'PvP classic' },
]

// Per-platform availability (verified Oct 2026):
// - Paper/Spigot build for every version incl. legacy 1.8.8 / 1.12.2
// - Fabric only supports 1.14+ (no 1.12.2 / 1.8.8)
// - Forge/NeoForge: 26.x via NeoForge (beta builds), no 1.8.8 builds
export const PLATFORM_VERSIONS: Record<string, string[]> = {
  vanilla: VERSIONS.map((v) => v.id),
  paper: VERSIONS.map((v) => v.id),
  spigot: VERSIONS.map((v) => v.id),
  fabric: VERSIONS.map((v) => v.id).filter((id) => id !== '1.12.2' && id !== '1.8.8'),
  forge: VERSIONS.map((v) => v.id).filter((id) => id !== '1.8.8'),
}

export function versionsForPlatform(platform: string): VersionEntry[] {
  const allowed = PLATFORM_VERSIONS[platform] ?? VERSIONS.map((v) => v.id)
  return VERSIONS.filter((v) => allowed.includes(v.id))
}

// "26.3 · Wilderness Bound" (falls back to the raw id for unknown versions)
export function versionLabel(id: string): string {
  const v = VERSIONS.find((x) => x.id === id)
  return v?.note ? `${v.label} · ${v.note}` : id
}

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

// One-click installable add-ons. jarPrefix matches the jar FileNode name in
// plugins/ or mods/ — installed state is derived from the real file tree.
export interface PluginCatalogItem {
  id: string
  name: string
  author: string
  category: 'Utility' | 'Admin' | 'Performance' | 'Protection' | 'Gameplay' | 'Library' | 'Social' | 'World' | 'Fun'
  platforms: string[] // paper | spigot | fabric | forge
  jarPrefix: string
  version: string
  sizeKb: number
  downloads: string
  desc: string
}

export const PLUGIN_CATALOG: PluginCatalogItem[] = [
  // ── Bukkit ecosystem (Paper / Spigot) ──
  { id: 'essentialsx', name: 'EssentialsX', author: 'EssentialsX Team', category: 'Utility', platforms: ['paper', 'spigot'], jarPrefix: 'EssentialsX-', version: '2.21.0', sizeKb: 2153, downloads: '62.4M', desc: 'The essential kit: homes, warps, kits, teleporting and 100+ commands every survival server needs.' },
  { id: 'luckperms', name: 'LuckPerms', author: 'Luck', category: 'Admin', platforms: ['paper', 'spigot', 'fabric', 'forge'], jarPrefix: 'LuckPerms-', version: '5.5.5', sizeKb: 10529, downloads: '41.2M', desc: 'Advanced, highly configurable permissions manager with web editor and group inheritance.' },
  { id: 'worldedit', name: 'WorldEdit', author: 'EngineHub', category: 'Utility', platforms: ['paper', 'spigot'], jarPrefix: 'WorldEdit-', version: '7.4.0', sizeKb: 2512, downloads: '55.8M', desc: 'In-game map editor — sculpt terrain, copy/paste structures and fix grief in seconds.' },
  { id: 'vault', name: 'Vault', author: 'sleaker', category: 'Library', platforms: ['paper', 'spigot'], jarPrefix: 'Vault-', version: '1.8.1', sizeKb: 428, downloads: '38.9M', desc: 'The bridge between plugins — economy, permissions and chat hooks every network relies on.' },
  { id: 'placeholderapi', name: 'PlaceholderAPI', author: 'HelpChat', category: 'Library', platforms: ['paper', 'spigot'], jarPrefix: 'PlaceholderAPI-', version: '2.11.6', sizeKb: 610, downloads: '30.1M', desc: 'Thousands of placeholders (%player_name%, %server_tps%…) for scoreboards, TAB and chat.' },
  { id: 'coreprotect', name: 'CoreProtect', author: 'Intelli', category: 'Admin', platforms: ['paper', 'spigot'], jarPrefix: 'CoreProtect-', version: '22.4.0', sizeKb: 2048, downloads: '12.7M', desc: 'Block-logging and rollback — find out exactly who griefed what, and undo it.' },
  { id: 'griefprevention', name: 'GriefPrevention', author: 'TechFortress', category: 'Protection', platforms: ['paper', 'spigot'], jarPrefix: 'GriefPrevention-', version: '16.18.2', sizeKb: 1229, downloads: '8.9M', desc: 'Self-serve land claims with a golden shovel. Zero-config anti-grief for survival servers.' },
  { id: 'worldguard', name: 'WorldGuard', author: 'EngineHub', category: 'Protection', platforms: ['paper', 'spigot'], jarPrefix: 'WorldGuard-', version: '7.0.12', sizeKb: 2210, downloads: '33.7M', desc: 'Region protection, flags and spawn safety — the industry standard since 2010.' },
  { id: 'multiverse', name: 'Multiverse-Core', author: 'Multiverse Team', category: 'World', platforms: ['paper', 'spigot'], jarPrefix: 'Multiverse-Core-', version: '4.3.12', sizeKb: 918, downloads: '14.6M', desc: 'Multiple worlds with per-world rules: creative world, mining world, event worlds and more.' },
  { id: 'viaversion', name: 'ViaVersion', author: 'ViaVersion', category: 'Utility', platforms: ['paper', 'spigot'], jarPrefix: 'ViaVersion-', version: '5.4.2', sizeKb: 1460, downloads: '28.3M', desc: 'Let friends on newer client versions join your server — no downgrade needed.' },
  { id: 'protocollib', name: 'ProtocolLib', author: 'dmulloy2', category: 'Library', platforms: ['paper', 'spigot'], jarPrefix: 'ProtocolLib-', version: '5.3.0', sizeKb: 890, downloads: '24.9M', desc: 'Low-level packet library that powers half the plugin ecosystem.' },
  { id: 'tab', name: 'TAB', author: 'NEZNAMY', category: 'Fun', platforms: ['paper', 'spigot'], jarPrefix: 'TAB-', version: '5.2.1', sizeKb: 2400, downloads: '6.8M', desc: 'Custom tab list, nametags, bossbar and scoreboard with placeholders and animations.' },
  { id: 'discordsrv', name: 'DiscordSRV', author: 'Scarsz', category: 'Social', platforms: ['paper', 'spigot'], jarPrefix: 'DiscordSRV-', version: '1.29.0', sizeKb: 3200, downloads: '5.4M', desc: 'Link Minecraft chat to a Discord channel — cross-platform chat, joins and deaths.' },
  { id: 'spark', name: 'spark', author: 'lucko', category: 'Performance', platforms: ['paper', 'spigot', 'fabric', 'forge'], jarPrefix: 'spark-', version: '1.10.98', sizeKb: 2800, downloads: '15.5M', desc: 'The profiler — find exactly what eats your TPS with CPU sampling and heap reports.' },
  // ── Fabric / NeoForge ecosystem ──
  { id: 'fabric-api', name: 'Fabric API', author: 'modmuss50', category: 'Library', platforms: ['fabric'], jarPrefix: 'fabric-api-', version: '0.131.2', sizeKb: 2256, downloads: '48.9M', desc: 'The essential hooks every Fabric mod builds on. Install this first.' },
  { id: 'lithium', name: 'Lithium', author: 'CaffeineMC', category: 'Performance', platforms: ['fabric', 'forge'], jarPrefix: 'lithium-', version: '0.16.2', sizeKb: 490, downloads: '21.3M', desc: 'Server-side optimization of physics, mob AI and ticking — free TPS, zero behavior change.' },
  { id: 'krypton', name: 'Krypton', author: 'CaffeineMC', category: 'Performance', platforms: ['fabric'], jarPrefix: 'krypton-', version: '0.3.2', sizeKb: 310, downloads: '8.1M', desc: 'Optimizes the network stack and packet pipeline for high-player-count servers.' },
  { id: 'carpet', name: 'Carpet', author: 'gnembon', category: 'Utility', platforms: ['fabric'], jarPrefix: 'fabric-carpet-', version: '1.4.180', sizeKb: 850, downloads: '11.2M', desc: 'Technical survival tweaks and fake players (/player bot) for farms and testing.' },
  { id: 'jei', name: 'Just Enough Items (JEI)', author: 'mezz', category: 'Utility', platforms: ['forge', 'fabric'], jarPrefix: 'jei-', version: '19.8.2', sizeKb: 1285, downloads: '310M', desc: 'Recipe and item browser — the modpack classic. Works server-side for recipes.' },
  { id: 'create', name: 'Create', author: 'simibubi', category: 'Gameplay', platforms: ['forge'], jarPrefix: 'create-', version: '7.0.2', sizeKb: 24313, downloads: '95.4M', desc: 'Rotational contraptions, trains, factories — the definitive engineering mod.' },
  { id: 'arsnouveau', name: 'Ars Nouveau', author: 'baileyholl', category: 'Gameplay', platforms: ['forge'], jarPrefix: 'ars_nouveau-', version: '5.4.0', sizeKb: 15600, downloads: '18.6M', desc: 'Build your own spells, familiars and magical automation.' },
  { id: 'jade', name: 'Jade', author: 'Snownee', category: 'Utility', platforms: ['forge', 'fabric'], jarPrefix: 'Jade-', version: '15.10.0', sizeKb: 690, downloads: '44.2M', desc: 'Shows what you are looking at — block info, progress, and mob stats on hover.' },
]

export const PLUGIN_CATEGORIES = ['All', 'Utility', 'Admin', 'Performance', 'Protection', 'Gameplay', 'Library', 'Social', 'World', 'Fun'] as const

export function pluginsForPlatform(platform: string): PluginCatalogItem[] {
  return PLUGIN_CATALOG.filter((p) => p.platforms.includes(platform))
}

export function cadenceLabel(min: number): string {
  if (min < 60) return `Every ${min} min`
  if (min < 1440) {
    const h = min / 60
    return h === 1 ? 'Every hour' : `Every ${h} hours`
  }
  if (min < 10080) {
    const d = min / 1440
    return d === 1 ? 'Every day' : `Every ${d} days`
  }
  const w = min / 10080
  return w === 1 ? 'Every week' : `Every ${w} weeks`
}

export const CADENCE_OPTIONS = [
  { min: 60, label: 'Every hour' },
  { min: 360, label: 'Every 6 hours' },
  { min: 720, label: 'Every 12 hours' },
  { min: 1440, label: 'Every day' },
  { min: 10080, label: 'Every week' },
]

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

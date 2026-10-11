// Server-side helpers: seed file trees, players, and generate server.properties
import { db } from '@/lib/db'
import { NAME_POOL } from '@/lib/mc'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function genUuid(): string {
  const h = '0123456789abcdef'
  const seg = (len: number) =>
    Array.from({ length: len }, () => h[Math.floor(Math.random() * 16)]).join('')
  return `${seg(8)}-${seg(4)}-4${seg(3)}-a${seg(3)}-${seg(12)}`
}

export function genProperties(s: {
  motd: string
  port: number
  gamemode: string
  difficulty: string
  maxPlayers: number
  pvp: boolean
  onlineMode: boolean
  whitelist: boolean
  worldType: string
  region: string
}): string {
  const d = new Date()
  const stamp = `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} UTC ${d.getFullYear()}`
  return [
    '#Minecraft server properties',
    `#${stamp}`,
    'accepts-transfers=false',
    'allow-flight=false',
    'allow-nether=true',
    'broadcast-console-to-ops=true',
    'broadcast-rcon-to-ops=true',
    `difficulty=${s.difficulty}`,
    'enable-command-block=false',
    'enable-jmx-monitoring=false',
    'enable-rcon=false',
    'enable-status=true',
    'enforce-secure-profile=true',
    `gamemode=${s.gamemode}`,
    'generate-structures=true',
    'generator-settings={}',
    'hardcore=false',
    'hide-online-players=false',
    'level-name=world',
    'level-seed=',
    `level-type=${s.worldType === 'large_biomes' ? 'normal' : s.worldType}`,
    `max-players=${s.maxPlayers}`,
    `motd=${s.motd}`,
    'network-compression-threshold=256',
    `online-mode=${s.onlineMode}`,
    'op-permission-level=4',
    'pause-when-empty-seconds=60',
    'player-idle-timeout=0',
    `pvp=${s.pvp}`,
    'query.port=25565',
    'rate-limit=0',
    'rcon.password=',
    'rcon.port=25575',
    'region=' + s.region,
    'require-resource-pack=false',
    'server-ip=',
    `server-port=${s.port}`,
    'simulation-distance=10',
    'spawn-monsters=true',
    'spawn-protection=16',
    'sync-chunk-writes=true',
    'text-filtering-config=',
    'use-native-transport=true',
    'view-distance=10',
    `white-list=${s.whitelist}`,
  ].join('\n')
}

interface SeedFile {
  name: string
  isDir?: boolean
  content?: string
  size?: number
  children?: SeedFile[]
}

export async function seedFileTree(serverId: string, platform: string, propertiesText: string): Promise<void> {
  const jars: Record<string, SeedFile[]> = {
    paper: [
      { name: 'EssentialsX-2.20.1.jar', size: 2_186_112 },
      { name: 'LuckPerms-5.4.150.jar', size: 10_489_523 },
      { name: 'WorldEdit-7.3.0.jar', size: 2_528_256 },
    ],
    spigot: [
      { name: 'EssentialsX-2.20.1.jar', size: 2_186_112 },
      { name: 'Vault-1.7.3.jar', size: 425_984 },
    ],
    fabric: [
      { name: 'fabric-api-0.119.4.jar', size: 2_246_656 },
      { name: 'lithium-fabric-0.14.4.jar', size: 487_424 },
      { name: 'sodium-fabric-0.6.3.jar', size: 932_864 },
    ],
    forge: [
      { name: 'jei-1.21.4-forge.jar', size: 1_284_096 },
      { name: 'create-6.0.4-forge.jar', size: 24_117_248 },
    ],
    vanilla: [],
  }

  const logContent = [
    `[${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}] [Server thread/INFO]: Starting minecraft server`,
    `[${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}] [Server thread/INFO]: Loading properties`,
    `[${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}] [Server thread/INFO]: Preparing level "world"`,
    `[${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}] [Server thread/INFO]: Done (3.212s)! For help, type "help"`,
  ].join('\n')

  const tree: SeedFile[] = [
    { name: 'server.properties', content: propertiesText, size: propertiesText.length },
    { name: 'eula.txt', content: '#By changing the setting below to TRUE you are indicating your agreement to our EULA.\n#Sat Oct 11 00:00:00 UTC 2026\neula=true', size: 124 },
    { name: 'whitelist.json', content: '[]', size: 2 },
    { name: 'ops.json', content: '[]', size: 2 },
    { name: 'banned-players.json', content: '[]', size: 2 },
    {
      name: 'logs',
      isDir: true,
      children: [
        { name: 'latest.log', content: logContent, size: logContent.length },
        { name: '2026-10-11-1.log.gz', size: 8_923 },
      ],
    },
    {
      name: 'world',
      isDir: true,
      children: [
        { name: 'level.dat', size: 4_281 },
        { name: 'session.lock', size: 13 },
        { name: 'level.dat_old', size: 4_180 },
        { name: 'usercache.json', size: 312 },
        {
          name: 'region',
          isDir: true,
          children: [
            { name: 'r.0.0.mca', size: 12_437_184 },
            { name: 'r.0.-1.mca', size: 9_481_216 },
            { name: 'r.-1.0.mca', size: 8_912_896 },
          ],
        },
        { name: 'playerdata', isDir: true, children: [] },
        { name: 'datapacks', isDir: true, children: [] },
      ],
    },
    ...(platform === 'fabric' || platform === 'forge'
      ? [{ name: 'mods', isDir: true, children: jars[platform] }]
      : platform === 'vanilla'
        ? []
        : [{ name: 'plugins', isDir: true, children: jars[platform] }]),
    ...(platform === 'paper' || platform === 'spigot'
      ? [{ name: 'config', isDir: true, children: [{ name: 'paper-global.yml', content: '_version: 29\nuse-alternative-luck-formula: false\n' + 'async-chunks:\n  threads: -1\n', size: 98 }] }]
      : []),
  ]

  async function insert(nodes: SeedFile[], parentId: string | null): Promise<void> {
    for (const n of nodes) {
      const created = await db.fileNode.create({
        data: {
          serverId,
          parentId,
          name: n.name,
          isDir: !!n.isDir,
          content: n.isDir ? null : (n.content ?? null),
          size: n.isDir ? 0 : (n.size ?? n.content?.length ?? 0),
        },
      })
      if (n.children?.length) await insert(n.children, created.id)
    }
  }
  await insert(tree, null)
}

export async function seedPlayers(serverId: string, whitelistOn: boolean): Promise<void> {
  const count = 10 + Math.floor(Math.random() * 5)
  const shuffled = [...NAME_POOL].sort(() => Math.random() - 0.5).slice(0, count)
  await db.player.createMany({
    data: shuffled.map((name, i) => ({
      serverId,
      name,
      uuid: genUuid(),
      isOp: i === 0,
      isBanned: i === 3 && Math.random() > 0.4,
      isWhitelisted: whitelistOn && i < 4,
      joins: 1 + Math.floor(Math.random() * 40),
      playTimeMin: 30 + Math.floor(Math.random() * 3600),
      lastSeen: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400_000),
    })),
  })
}

export async function pickPort(): Promise<number> {
  const used = new Set((await db.server.findMany({ select: { port: true } })).map((s) => s.port))
  for (let i = 0; i < 40; i++) {
    const p = 25565 + Math.floor(Math.random() * 60)
    if (!used.has(p)) return p
  }
  return 25610
}

#!/usr/bin/env python3
"""Update CraftHost demo DB to current Minecraft versions (Oct 2026 research).

- Blockhaven SMP: paper 1.21.4 -> 26.3 (Wilderness Bound, latest release)
- Emerald Isle:    fabric 1.21.4 -> 26.2 (Chaos Cubed)
- Refresh mod jar names + latest.log to 26.x-era formats
"""
import sqlite3

DB = '/home/z/my-project/db/custom.db'
con = sqlite3.connect(DB)
cur = con.cursor()

# ── 1. Server versions ────────────────────────────────────────────────
cur.execute("UPDATE Server SET version='26.3', updatedAt=datetime('now') WHERE name='Blockhaven SMP'")
cur.execute("UPDATE Server SET version='26.2', updatedAt=datetime('now') WHERE name='Emerald Isle'")

# ── 2. Mod jar names (fabric server: Emerald Isle) ───────────────────
jar_renames = [
    ('fabric-api-0.119.4.jar', 'fabric-api-0.131.2+26.2.jar'),
    ('lithium-fabric-0.14.4.jar', 'lithium-fabric-0.16.2+26.2.jar'),
    # sodium is client-side only — swap for spark (real server-side profiler)
    ('sodium-fabric-0.6.3.jar', 'spark-1.10.98-fabric.jar'),
]
for old, new in jar_renames:
    cur.execute('UPDATE FileNode SET name=? WHERE name=?', (new, old))

# paper plugins (Blockhaven)
plugin_renames = [
    ('EssentialsX-2.20.1.jar', 'EssentialsX-2.21.0.jar'),
    ('LuckPerms-5.4.150.jar', 'LuckPerms-5.5.5.jar'),
    ('WorldEdit-7.3.0.jar', 'WorldEdit-7.4.0.jar'),
]
for old, new in plugin_renames:
    cur.execute('UPDATE FileNode SET name=? WHERE name=?', (new, old))

# ── 3. latest.log — regenerate in 26.x format per server version ─────
log_lines = [
    '[ServerMain/INFO]: Loading Minecraft {v} with Java 25.0.2',
    '[ServerMain/INFO]: Loading server properties',
    '[ServerMain/INFO]: Default game type: SURVIVAL',
    '[Server thread/INFO]: Starting minecraft server version {v}',
    '[Server thread/INFO]: Preparing level "world"',
    '[Server thread/INFO]: Done (3.212s)! For help, type "help"',
]
for server_id, ver in cur.execute('SELECT id, version FROM Server').fetchall():
    content = '\n'.join(f'[10:24:0{i}] {l.format(v=ver)}' for i, l in enumerate(log_lines))
    cur.execute(
        "UPDATE FileNode SET content=?, size=? WHERE name='latest.log' AND serverId=?",
        (content, len(content), server_id),
    )

con.commit()

# ── Report ────────────────────────────────────────────────────────────
print('Servers now:')
for row in cur.execute('SELECT name, platform, version FROM Server'):
    print('  ', row)
print('Mod/plugin jars now:')
for row in cur.execute("SELECT name FROM FileNode WHERE name LIKE '%.jar'"):
    print('  ', row[0])
print('latest.log sample (first server):')
row = cur.execute("SELECT content FROM FileNode WHERE name='latest.log' LIMIT 1").fetchone()
print('  ', row[0].split('\n')[0])
con.close()

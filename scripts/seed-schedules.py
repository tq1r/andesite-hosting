#!/usr/bin/env python3
"""Seed demo scheduled tasks so the new Schedules tab has content."""
import sqlite3, random, string, time

DB = '/home/z/my-project/db/custom.db'
con = sqlite3.connect(DB)
cur = con.cursor()

def cuid():
    # prisma cuid-ish: 'c' + timestamp base36 + random
    t = int(time.time() * 1000)
    b36 = ''
    while t:
        t, r = divmod(t, 36)
        b36 = (string.digits + string.ascii_lowercase)[r] + b36
    rnd = ''.join(random.choices(string.ascii_lowercase + string.digits, k=17))
    return f'c{b36}{rnd}'

cur.execute("SELECT id, name FROM Server WHERE name='Blockhaven SMP'")
row = cur.fetchone()
if not row:
    raise SystemExit('Blockhaven SMP not found')
sid, sname = row

# clear old demo schedules for idempotency
cur.execute("DELETE FROM Schedule WHERE serverId=?", (sid,))

now = int(time.time() * 1000)
schedules = [
    ('Nightly backup', 1440, 'backup', None, 1, now - 5*3600*1000, 'backup created (184 MB)'),
    ('Morning restart', 720, 'restart', None, 1, now - 2*3600*1000, 'server restarted'),
]
for name, every, action, payload, enabled, last_ms, result in schedules:
    cur.execute(
        "INSERT INTO Schedule (id, serverId, name, everyMin, action, payload, enabled, lastRunAt, lastResult, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (cuid(), sid, name, every, action, payload, bool(enabled), last_ms, result, now - 86400*1000),
    )

con.commit()
for row in cur.execute("SELECT name, everyMin, action, enabled, lastResult FROM Schedule"):
    print(row)
con.close()

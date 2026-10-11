# Andesite Hosting

**Carved-from-stone Minecraft server hosting** — a landing page plus a full server-management panel, in the style of commercial hosts (Pterodactyl, BisectHosting, PebbleHost). Warm stone theme, ember accents, and a live simulated Minecraft engine.

> Fan-made demo project. Not affiliated with Mojang Studios or Microsoft.

## What's inside

- **Landing page** — hero, features, pricing (stone-family tiers: Andesite / Diorite / Granite / Obsidian), FAQ
- **Server panel** — dashboard, live console, real-time stats, players, file manager (CRUD + upload/download/rename/move), backups (create/restore/download), one-click plugin & mod installer (22-item catalog), scheduled tasks, settings (full `server.properties` editor, version switcher with reinstall, SFTP credentials)
- **Live simulation engine** (`mini-services/mc-engine`) — a socket.io companion service that boots realistic 26.x-era servers, streams logs, simulates players joining/chatting/dying, handles 20+ console commands, samples CPU/RAM/TPS, and runs scheduled tasks via its own watchdog — even with the tab closed
- **REST API** — zod-validated Next.js route handlers on Prisma/SQLite (the panel's source of truth)

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│  Next.js 16 SPA (port   │  HTTP  │  mc-engine (port 3003 ws /   │
│  3000) — landing +      │◄──────►│  3004 internal) — simulated  │
│  panel + REST APIs      │        │  servers, players, schedules │
│  Prisma ◄── SQLite      │        │  watchdog, live metrics      │
└─────────────────────────┘        └──────────────────────────────┘
```

- **Next.js** owns the database and all mutations; the engine executes live behavior and reports back
- The engine bootstraps its schedule list on boot and re-syncs whenever schedules/plugins change

## Local development

```bash
# 1. Install + prepare the database
bun install               # postinstall runs `prisma generate`
bun run db:push           # create SQLite schema (skip if db/custom.db is present —
                          # it ships with demo servers already seeded)

# 2. Start the app
bun run dev               # http://localhost:3000

# 3. Start the live engine (separate terminal)
bun run engine            # socket.io :3003 + internal API :3004
```

The dev gateway rewrites `/?XTransformPort=3003` to the engine so the panel's live console works through one origin.

> Already have a database? `db/custom.db` ships with demo servers (Blockhaven SMP on Paper 26.3, Emerald Isle on Fabric 26.2) — commit-safe demo state.

## Deploying to Vercel

The site deploys to Vercel out of the box:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftq1r%2Fandesite-hosting&project-name=andesite-hosting)

On serverless:

- `postinstall` runs `prisma generate`; the build is a plain `next build`
- On first request per instance, the bundled SQLite snapshot is copied to `/tmp` (read-only filesystem workaround) — **data is ephemeral on serverless**
- The live simulation engine is a long-running service and **does not run on Vercel**; the panel degrades gracefully (an "engine offline" chip appears in the console) while every database-backed feature — servers, files, backups, plugins, schedules, settings — keeps working

For the full live experience, run it locally (or on any VM) with the engine: `bun run build && bun run start & bun run engine`.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:../db/custom.db` | SQLite path (swap for Postgres/Turso in real deployments) |
| `NEXT_PUBLIC_ENGINE_URL` | `/?XTransformPort=3003` | Engine socket URL; set to a hosted engine or `disabled` |

## Brand

The Andesite mark is an 8×8 chiseled "A" with a molten ember crossbar on salt-and-pepper andesite grain. Regenerate the favicon/logo SVGs from the same grid as the React component:

```bash
bun run brand:assets
```

## Tech stack

Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui · Prisma 6 + SQLite · socket.io · zod · TanStack Query · Zustand · Recharts · framer-motion · Bun

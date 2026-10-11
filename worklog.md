# Worklog

---
Task ID: 4
Agent: main (Super Z)
Task: Host-parity audit + close every feature gap vs real Minecraft hosts (Pterodactyl / Bisect / PebbleHost): plugin installer, scheduled tasks, file manager upgrades, version switcher, SFTP, backup download

Work Log:
- Audited current app vs real host panels; identified 7 gaps: plugin/mod installer, scheduled tasks, file rename/upload/download/move, version switcher+reinstall, SFTP details, backup download, hardcoded /plugins
- Prisma: added Schedule model (name/everyMin/action/payload/enabled/lastRunAt/lastResult) + db push; activity types extended
- mc.ts: PLUGIN_CATALOG (22 real plugins/mods across Bukkit/Fabric/NeoForge ecosystems with authors/categories/downloads/sizes/jarPrefix), PLUGIN_CATEGORIES, pluginsForPlatform, cadenceLabel, CADENCE_OPTIONS, ScheduleDTO, ServerDTO.plugins
- Engine (mc-engine): RuntimeConfig.plugins; /plugins console command now lists REAL installed add-ons (Mods label for fabric/forge); boot logs "Loading N plugins: …"; SimEngine schedule watchdog (15s tick, executes backup/restart/command, reports results back to panel); cfgStore for power without explicit config; restart applies freshest config (version reinstall); internal HTTP API: /internal/power, /internal/command, /internal/schedules/sync; boot-time schedule bootstrap from /api/schedules/engine (retries)
- Next.js API: /api/servers/[id]/schedules (GET/POST), /api/schedules/[id] (PATCH/DELETE), /run (run-now executes action: backup via shared createBackupFor, restart/command via engine HTTP), /ran (engine report-back), /api/schedules/engine (bootstrap), /api/servers/[id]/plugins (GET installed/POST install/uninstall — creates/deletes jars in plugins//mods/ with prefix matching, announces on live console), /api/servers/[id]/reinstall (version switch w/ validation, latest.log refresh, activity), files POST accepts binary size, files PATCH supports move with cycle prevention
- seed.ts: serverPluginNames() (derives installed add-on display names from real file tree), createBackupFor() shared helper
- engine.ts: enginePower/engineCommand/syncSchedules helpers (sync includes plugin lists)
- UI: new PluginsTab (marketplace grid, search, category chips, install/uninstall, installed strip) + SchedulesTab (list with badges/last-run, create/edit dialog, run-now, pause toggle, delete); ServerView adds Plugins (platform-aware, badge count) + Schedules tabs; FilesTab adds Upload (multi, text content/binary size), Download (text blob, binary → SFTP hint), Rename, Move (folder select w/ descendant blocking); SettingsTab adds version switcher + Reinstall (confirm dialog, auto-restart when online) + SFTP access card (host/port/username/password reveal+copy); BackupsTab download button (manifest json); landing copy updated (installer + scheduler)
- Demo data: seeded 2 schedules for Blockhaven (Nightly backup/backup/1440 + Morning restart/restart/720 with run history)
- Fixed: dev server had stale Prisma client → restarted (Schedule model 500); engine pkill pattern miss → kill by port PID; cadence labels ("Every day/hour"), combobox a11y names in schedule dialog
- Verified via agent-browser E2E: boot log "Loading 3 plugins: EssentialsX, LuckPerms, WorldEdit"; /plugins lists real 3; installed strip + Install flips to Installed; ViaVersion install → jar in /plugins + console say line + badge 4; rename round-trip; move to /world and back to / (folder select with paths); upload API text+binary; schedules render with history; run-now backup created real backup (176.5 MB); created "Hourly announce" command schedule → run-now fired console say + engine watchdog auto-executed first run autonomously; reinstall 26.3→26.1.2 (auto-restarted, booted 26.1.2) and back to 26.3; SFTP reveal/copy buttons; backup download manifest; landing shows "Plugin & mod installer"; zero page errors; lint clean

Stage Summary:
- CraftHost now at full feature parity with commercial host panels: one-click plugin/mod installer (22-item catalog), scheduled tasks engine (watchdog runs them even with tab closed), full-featured file manager (browse/edit/create/rename/move/upload/download), version switcher with reinstall, SFTP credentials, backup download
- Engine architecture: Next.js = source of truth (SQLite), engine = autonomous executor (bootstraps schedules on boot, syncs on every change, reports run results back)
- All existing functionality intact (console/stats/players/backups/settings/wizard/landing)

---
Task ID: 3
Agent: main (Super Z)
Task: Research CURRENT real Minecraft versions via live web sources (user: "1.21.4 isn't the latest — research, don't use your data") and update the whole app to the real version catalog

Work Log:
- Researched via live APIs/docs (NOT training data):
  - Mojang piston-meta manifest → latest release 26.3 (2026-09-15), snapshot 26.4-snapshot-3
  - minecraft.net (Dec 2, 2025 announcement) → version scheme now calendar-year based ("26" = 2026); 1.21.11 (2025-12-09) was the last 1.21.x
  - minecraft.wiki → 26.3 "Wilderness Bound" (Dappled Forest, shelf mushrooms, abandoned camps); 26.2 "Chaos Cubed" (sulfur caves, 2026-06-16); 26.1 "Tiny Takeover" (2026-03-24, Golden Dandelion); launcher bundles Java SE 25 since 26.1
  - PaperMC v3 API (fill.papermc.io) → Paper builds 26.3/26.2/26.1.x/1.21.11→1.21.4
  - Fabric meta → stable 26.3→1.16.5 (no 1.12.2/1.8.8)
  - NeoForge maven → 26.3.0.x-beta builds exist
- src/lib/mc.ts: rewrote VERSIONS catalog (26.3/26.2/26.1.2 + 1.21.11→1.8.8) with drop-name notes; added LATEST_VERSION/LATEST_DROP, PLATFORM_VERSIONS compat map + versionsForPlatform() + versionLabel() helpers
- CreateServerWizard: default version 26.3; version list now filtered per platform (Fabric excludes 1.12.2/1.8.8, Forge excludes 1.8.8); version auto-resets to latest allowed when platform can't build it; dropdown shows drop names
- SettingsTab: version box shows rich label ("26.3 · Wilderness Bound"); removed unused VERSIONS import
- Landing: "Any version" feature + versions FAQ now cite 26.3 "Wilderness Bound" + NeoForge note
- seed.ts: 26.x-era jar names (fabric-api-0.131.2+<ver>.jar, jei-<ver>-neoforge.jar, sodium→spark swap — sodium is client-side); latest.log seeded in new boot format; seedFileTree now takes version param (route.ts updated)
- mc-engine sim.ts: boot sequence reworked to 26.x-era logs (ServerMain thread, "Loading Minecraft <ver> with Java 25.0.2", permissions.yml line gated to Bukkit platforms)
- scripts/update-db-versions.py: migrated demo DB — Blockhaven SMP → Paper 26.3, Emerald Isle → Fabric 26.2; renamed mod/plugin jars in DB; regenerated latest.log contents
- Restarted mc-engine (clean state, new boot sequence); lint clean
- Verified via agent-browser (gateway :81): landing copy shows 26.3 Wilderness Bound; cards show Paper 26.3 / Fabric 26.2; boot log streams "Loading Minecraft 26.3 with Java 25.0.2" → "Starting minecraft server version 26.3" → Paper line → Done; wizard defaults 26.3, Fabric dropdown ends at 1.16.5, Paper shows all 15 incl. 1.12.2/1.8.8; full deploy of test server on Vanilla 26.3 (seeded files show new log format) then deleted it; zero page errors

Stage Summary:
- App now matches the real October 2026 Minecraft ecosystem: latest 26.3 "Wilderness Bound" (Sept 15, 2026), calendar-year versioning, Java 25 runtime, per-platform version availability verified against PaperMC/Fabric/NeoForge APIs
- Demo state: Blockhaven SMP (Paper 26.3, boots with Java 25 line) + Emerald Isle (Fabric 26.2); wizard is platform-aware
- Research artifacts: scripts/mc-manifest.json, scripts/search-*.json; migration script: scripts/update-db-versions.py

---
Task ID: 1
Agent: main (Super Z)
Task: Build CraftHost — Minecraft server hosting website (GTA-hosting style) with landing page + full server management panel

Work Log:
- Loaded fullstack-dev skill, initialized environment (dev server running on port 3000)
- Read scaffold: Prisma/SQLite, shadcn/ui, Tailwind 4, socket.io examples, Caddyfile gateway (XTransformPort pattern)
- Plan: SPA on `/` with two views (landing / panel), Next.js REST APIs + Prisma DB, socket.io mini-service on port 3003 as live server-simulation engine (console logs, metrics, simulated players, command handling)

Stage Summary:
- Environment ready; building now

---
Task ID: 2
Agent: main (Super Z)
Task: Build, verify and finalize CraftHost — Minecraft server hosting website

Work Log:
- Prisma schema (Server/Player/FileNode/Backup/Activity) pushed to SQLite
- 10 REST API routes under /api/servers|players|files|backups|activity (zod-validated, engine status merge, activity feed entries, seeded file trees + players + server.properties on create)
- mc-engine mini-service (mini-services/mc-engine, port 3003 socket.io + 3004 internal HTTP): realistic boot/stop sequences, spawn-area progress, simulated players (join/leave/chat/deaths/advancements), autosave, "Can't keep up" warnings, live CPU/RAM/TPS/network samples, 20+ console commands (help/list/say/kick/ban/op/whitelist/gamemode/tp/time/weather/seed/tps/plugins/stop…)
- Fixed: socket.io path '/' intercepts all HTTP → internal API moved to port 3004
- Frontend: dark Minecraft theme (emerald/zinc, Press Start 2P pixel font), landing page (hero/features/pricing/FAQ/footer), panel (sidebar, dashboard, stats cards, activity feed), 4-step deploy wizard with animated progress, server detail with Console (live logs, colored levels, command history, quick commands), Stats (recharts live charts), Players (live roster + known players, op/ban/kick), Files (browser/editor/create/delete), Backups (create/restore/delete), Settings (full server.properties UI + danger zone)
- Fixed: console input disabled bug (status driven from live query cache instead of stale local state), missing dialog descriptions (a11y), port bug in POST /api/servers, lint errors (setState-in-effect → key-based remounts, latest-ref pattern)
- Verified via agent-browser through Caddy gateway (localhost:81): landing→panel→start server→live boot logs→commands→stats→players→files edit/save→backups→wizard deploy→new server page; mobile 390px no overflow; VLM QA on landing/dashboard/console/mobile screenshots all pass; zero page errors; lint clean

Stage Summary:
- Fully working Minecraft hosting panel with live simulated servers (socket.io engine + Prisma REST + Next.js 16 SPA on /)
- Demo state: "Blockhaven SMP" (Paper 1.21.4, online w/ simulated players) + "Emerald Isle" (Fabric, offline) — user can start/stop, run commands, manage everything
- Engine: mini-services/mc-engine (bun --hot), internal API :3004; dev server :3000 via gateway :81

---
Task ID: 5
Agent: main (Super Z)
Task: Rebrand CraftHost → "Andesite Hosting" with andesite-vibe redesign; make repo GitHub+Vercel ready; push to GitHub; deploy to Vercel

Work Log:
- Brand: new AndesiteMark component (8×8 chiseled stone "A" with molten ember crossbar on salt-and-pepper andesite grain) replacing CreeperMark; generated matching src/app/icon.svg favicon + public/logo.svg via scripts/gen-brand-assets.mjs (bun run brand:assets); metadata retitled "Andesite Hosting — Minecraft Server Hosting"
- Theme (globals.css): warm stone grays (oklch hue 80) + ember-copper primary (oklch 0.705 0.155 50), warm chart palette, ember selection, .font-display (Space Grotesk via next/font, replaced Press Start 2P), .bg-stone-grid + .bg-stone-grain (feTurbulence) textures replaced .bg-pixel-grid
- Copy: Landing rewritten in andesite voice ("Your Minecraft server. Set in stone in 60 seconds.", "Ready to carve out your world?", FloatingShards in andesite grays+ember); PLANS renamed Dirt/Iron/Diamond/Netherite → Andesite/Diorite/Granite/Obsidian; play.andesite.host + sftp.andesite.host domains; [Andesite] console prefix; MOTD default "An Andesite server"
- Color sweep (13 files): emerald→orange brand accents, zinc→stone, font-pixel→font-display; semantic greens intentionally kept (online status dots/badges, RAM-health bar, CHAT log color, PlayersTab online chips, OP badges, Panel healthy dot)
- Vercel readiness: package.json → name andesite-hosting, postinstall "prisma generate", build = plain next build (standalone moved to build:standalone), engine + brand:assets scripts; next.config → output standalone only when not VERCEL, outputFileTracingIncludes bundles db/custom.db into /api routes; lib/db.ts → on VERCEL copies bundled SQLite snapshot to /tmp/andesite.db per instance; lib/socket.ts → NEXT_PUBLIC_ENGINE_URL override ('disabled' supported); use-server-socket → onEngineChange handler; ConsoleTab → amber "engine offline" chip + static-deployment empty state
- README.md: architecture diagram, local dev, engine, Vercel deploy section + button, env vars, brand regeneration, stack
- Cleanup: untracked QA screenshots/analysis JSONs from git, extended .gitignore (scripts/*.png, *analysis*.json, search-*.json, engine.log)
- Fixed ops: killed duplicate mc-engine processes (bun --hot leftovers; boot timers stuck in "starting" — killed by port PIDs, restarted single clean engine, 3 schedules bootstrapped)
- Verified: lint clean; production build passes (all /api routes dynamic ƒ, / + /icon.svg static); agent-browser E2E: landing (Andesite brand, stone+ember palette, stone-family pricing w/ orange Most popular on Granite, zero green leftovers), panel dashboard, Blockhaven boot → online → `list` (1/30 online) + `say [Andesite] brand check` round-trip on live console; tabs click-through with zero page errors; favicon 200; VLM audits of landing/panel/console/stats all pass
- Committed as 8ea0ac6 "Rebrand to Andesite Hosting — carved-from-stone theme"
- Infra for publish: gh CLI 2.76.2 installed at ~/bin (GitHub API rate-limited on shared IP → pinned-version tarball); vercel CLI installed at ~/.npm-global/bin/vercel; gh device-flow login started (code surfaced to user)

Stage Summary:
- App fully rebranded to Andesite Hosting with cohesive stone+ember design system; verified locally end-to-end
- Repo is GitHub/Vercel ready (build ✅); awaiting user GitHub device authorization (code E36E-4726) → next: create repo, push, fix README deploy URL to real owner, deploy via Vercel CLI or import button

'use client'

import { motion } from 'framer-motion'
import {
  Zap, TerminalSquare, Puzzle, Shield, HardDriveDownload, Activity, FolderCog, Repeat,
  ArrowRight, Check, ChevronDown, Globe, Cpu, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { AndesiteMark } from '@/components/AndesiteMark'
import { PLANS, PLATFORMS, LATEST_VERSION, LATEST_DROP } from '@/lib/mc'
import { useAppStore } from '@/lib/store'

const FEATURES = [
  { icon: Zap, title: 'Instant deployment', desc: 'Your server is provisioned and online in under 60 seconds. No queues, no setup scripts.' },
  { icon: TerminalSquare, title: 'Live console', desc: 'A real-time streaming console. Run commands, watch logs and chat as it happens.' },
  { icon: Puzzle, title: 'Plugin & mod installer', desc: 'One-click installs from a built-in catalog — Paper, Spigot, Fabric and Forge, no FTP needed.' },
  { icon: Shield, title: 'DDoS protection', desc: 'Enterprise-grade shielding on every node, included in every plan — even free.' },
  { icon: HardDriveDownload, title: 'Automatic backups', desc: 'Scheduled snapshots with one-click restore, plus a task scheduler for auto-restarts and recurring commands.' },
  { icon: Activity, title: 'Real-time metrics', desc: 'CPU, RAM, TPS and network charts streamed live, so you catch lag before players do.' },
  { icon: FolderCog, title: 'Full file access', desc: 'Edit server.properties, manage plugin configs and browse world data in your browser.' },
  { icon: Repeat, title: 'Any version', desc: `From 1.8.8 PvP classics to the latest ${LATEST_VERSION} “${LATEST_DROP}” drop — switch in a click.` },
]

const STEPS = [
  { n: '01', title: 'Pick your setup', desc: 'Choose a platform — Vanilla, Paper, Spigot, Fabric or Forge — and the version your crew plays.' },
  { n: '02', title: 'Configure gameplay', desc: 'RAM, slots, gamemode, difficulty, MOTD. Tune everything before the first chunk loads.' },
  { n: '03', title: 'Share & play', desc: 'Your server gets an address like play.andesite.host:25565. Send it to friends and start building.' },
]

const FAQS = [
  { q: 'Can I really host a server for free?', a: 'Yes — the Andesite plan gives you 2 GB of RAM, 10 GB of NVMe storage and the full panel with no credit card and no trial timer. It\'s perfect for a small survival world with friends.' },
  { q: 'Which platforms and versions are supported?', a: `Vanilla, Paper, Spigot, Fabric and Forge (NeoForge on 26.x), from 1.8.8 up to the latest ${LATEST_VERSION} “${LATEST_DROP}” release. You can deploy multiple servers on different versions at the same time.` },
  { q: 'Can I install plugins and mods?', a: 'Yes — the built-in catalog installs popular plugins and mods with one click (EssentialsX, LuckPerms, WorldEdit, Create and more). You can also upload any jar yourself via the file manager or SFTP.' },
  { q: 'What happens if my server crashes?', a: 'Every node runs a watchdog that restarts crashed servers automatically, and hourly backups mean you can roll back the world to any snapshot with one click from the panel.' },
  { q: 'Do I need to install anything on my PC?', a: 'No. Andesite runs entirely in your browser — console, file manager, backups, scheduled tasks and metrics. Your friends just connect with the standard Minecraft launcher.' },
]

function FloatingShards() {
  // andesite grays with a couple of ember flecks — stone chips drifting up
  const shards = [
    { x: '8%', y: '18%', size: 22, color: '#8f8d87', delay: 0, dur: 5 },
    { x: '86%', y: '12%', size: 16, color: '#7e7c76', delay: 0.8, dur: 6 },
    { x: '78%', y: '68%', size: 26, color: '#5c5a54', delay: 0.4, dur: 5.5 },
    { x: '14%', y: '72%', size: 14, color: '#a3a19a', delay: 1.2, dur: 6.5 },
    { x: '48%', y: '8%', size: 12, color: '#6b6962', delay: 0.2, dur: 7 },
    { x: '92%', y: '42%', size: 18, color: '#494742', delay: 1.6, dur: 5.2 },
    { x: '4%', y: '45%', size: 12, color: '#e8763a', delay: 0.6, dur: 6.2 },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {shards.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-[2px] opacity-40"
          style={{ left: b.x, top: b.y, width: b.size, height: b.size, background: b.color, boxShadow: `0 0 ${b.size}px ${b.color}55` }}
          animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export function Landing() {
  const goPanel = useAppStore((s) => s.goPanel)
  const openWizard = useAppStore((s) => s.openWizard)

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AndesiteMark size={28} />
            <span className="font-display text-lg font-semibold tracking-tight">
              <span className="text-stone-100">Andesite</span>{' '}
              <span className="text-stone-500 font-normal">Hosting</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-stone-400" aria-label="Main">
            <a href="#features" className="hover:text-orange-400 transition-colors">Features</a>
            <a href="#how" className="hover:text-orange-400 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">FAQ</a>
          </nav>
          <Button onClick={goPanel} className="bg-orange-500 text-stone-950 hover:bg-orange-400 font-semibold">
            Open Panel <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-stone-grid bg-stone-grain" aria-hidden />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-orange-500/10 blur-3xl" aria-hidden />
        <FloatingShards />
        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 md:pt-32 md:pb-28 text-center">
          <Badge variant="outline" className="mb-6 border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/10">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            12,480 servers online right now
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight md:leading-tight tracking-tight text-stone-100">
            Your Minecraft server.
            <br />
            <span className="text-orange-400">Set in stone in 60 seconds.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-stone-400">
            Andesite runs Vanilla, Paper, Spigot, Fabric and Forge straight from your browser —
            streaming console, one-click plugins, live metrics and automatic backups.
            No setup. No wobble.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => openWizard(2048)} className="bg-orange-500 text-stone-950 hover:bg-orange-400 font-semibold h-12 px-7 text-base">
              <Zap className="mr-2 h-5 w-5" /> Deploy a server — Free
            </Button>
            <Button size="lg" variant="outline" onClick={goPanel} className="h-12 px-7 text-base border-white/15 hover:bg-white/5 hover:text-orange-300">
              View the live panel
            </Button>
          </div>
          <p className="mt-4 text-xs text-stone-500">No credit card · 2 GB free forever · deploy in your browser</p>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              ['99.98%', 'uptime, 90-day avg'],
              ['12,480+', 'servers hosted'],
              ['3.2M', 'players each month'],
              ['6', 'low-latency regions'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="font-display text-lg md:text-xl font-semibold text-orange-400">{v}</div>
                <div className="mt-1.5 text-xs text-stone-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platforms strip ── */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-stone-500">
          <span className="text-xs uppercase tracking-widest">Runs</span>
          {PLATFORMS.map((p) => (
            <span key={p.id} className="font-semibold text-stone-400">{p.label}</span>
          ))}
          <span className="text-stone-600">+ any custom jar</span>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 md:py-24 w-full">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-stone-100">Everything a server owner needs</h2>
          <p className="mt-4 text-stone-400">A hosting panel that feels like a game, not a chore.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-white/[0.02] border-white/5 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="font-semibold text-stone-100">{f.title}</h3>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-stone-100">Three blocks to success</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative rounded-xl border border-white/5 bg-stone-950/60 p-6">
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-orange-500/50 to-transparent" aria-hidden />
                )}
                <div className="font-display text-xl font-semibold text-orange-400/80">{s.n}</div>
                <h3 className="mt-4 font-semibold text-stone-100">{s.title}</h3>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 md:py-24 w-full">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-stone-100">Plans for every world</h2>
          <p className="mt-4 text-stone-400">Start free on Andesite. Scale when your SMP outgrows the spawn chunks.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col bg-white/[0.02] ${plan.highlight ? 'border-orange-500/50 ring-1 ring-orange-500/30' : 'border-white/5'}`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-stone-950 font-semibold hover:bg-orange-500">
                  Most popular
                </Badge>
              )}
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-stone-100">{plan.name}</h3>
                  <span className="text-xs text-stone-500">{plan.tagline}</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-semibold text-orange-400">{plan.priceLabel}</span>
                  <span className="text-xs text-stone-500">{plan.period}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-400">
                  <Cpu className="h-3.5 w-3.5 text-orange-500/70" /> {plan.ramMb / 1024} GB RAM
                  <Users className="ml-2 h-3.5 w-3.5 text-orange-500/70" /> {plan.slots}
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-orange-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => openWizard(plan.ramMb)}
                  className={`mt-6 w-full font-semibold ${plan.highlight
                    ? 'bg-orange-500 text-stone-950 hover:bg-orange-400'
                    : 'bg-stone-800 text-stone-100 hover:bg-stone-700 border border-white/10'}`}
                >
                  Deploy {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-stone-500 flex items-center justify-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> All plans include DDoS protection, the full panel and instant setup.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-stone-100">Questions & answers</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/5">
                <AccordionTrigger className="text-left text-stone-200 hover:text-orange-300 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-orange-500 shrink-0" />
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-stone-400 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-stone-grid bg-stone-grain" aria-hidden />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-[800px] h-[400px] rounded-full bg-orange-500/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-stone-100">Ready to carve out your world?</h2>
          <p className="mt-5 text-stone-400">Your free server is one click and sixty seconds away.</p>
          <Button size="lg" onClick={() => openWizard(2048)} className="mt-8 bg-orange-500 text-stone-950 hover:bg-orange-400 font-semibold h-12 px-8 text-base">
            <Zap className="mr-2 h-5 w-5" /> Deploy my free server
          </Button>
        </div>
      </section>

      {/* ── Footer (sticky bottom) ── */}
      <footer className="mt-auto border-t border-white/5 bg-stone-950/80">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AndesiteMark size={22} />
            <span className="font-display text-sm text-stone-400">Andesite Hosting</span>
          </div>
          <p className="text-xs text-stone-600 text-center">
            A fan-made demo panel. Not affiliated with Mojang Studios or Microsoft.
          </p>
          <div className="flex items-center gap-5 text-xs text-stone-500">
            <a href="#features" className="hover:text-orange-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a>
            <button onClick={goPanel} className="hover:text-orange-400 transition-colors">Panel</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

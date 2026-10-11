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
import { CreeperMark } from '@/components/CreeperMark'
import { PLANS, PLATFORMS } from '@/lib/mc'
import { useAppStore } from '@/lib/store'

const FEATURES = [
  { icon: Zap, title: 'Instant deployment', desc: 'Your server is provisioned and online in under 60 seconds. No queues, no setup scripts.' },
  { icon: TerminalSquare, title: 'Live console', desc: 'A real-time streaming console. Run commands, watch logs and chat as it happens.' },
  { icon: Puzzle, title: 'Plugins & mods', desc: 'One-click Paper, Spigot, Fabric and Forge support with a built-in file manager.' },
  { icon: Shield, title: 'DDoS protection', desc: 'Enterprise-grade shielding on every node, included in every plan — even free.' },
  { icon: HardDriveDownload, title: 'Automatic backups', desc: 'Scheduled world snapshots with one-click restore. Griefers can\'t undo your work.' },
  { icon: Activity, title: 'Real-time metrics', desc: 'CPU, RAM, TPS and network charts streamed live, so you catch lag before players do.' },
  { icon: FolderCog, title: 'Full file access', desc: 'Edit server.properties, manage plugin configs and browse world data in your browser.' },
  { icon: Repeat, title: 'Any version', desc: 'From 1.8.8 PvP classics to the latest 1.21.4 release — switch in a click.' },
]

const STEPS = [
  { n: '01', title: 'Pick your setup', desc: 'Choose a platform — Vanilla, Paper, Spigot, Fabric or Forge — and the version your crew plays.' },
  { n: '02', title: 'Configure gameplay', desc: 'RAM, slots, gamemode, difficulty, MOTD. Tune everything before the first chunk loads.' },
  { n: '03', title: 'Share & play', desc: 'Your server gets an address like play.crafthost.gg:25565. Send it to friends and start building.' },
]

const FAQS = [
  { q: 'Can I really host a server for free?', a: 'Yes — the Dirt plan gives you 2 GB of RAM, 10 GB of NVMe storage and the full panel with no credit card and no trial timer. It\'s perfect for a small survival world with friends.' },
  { q: 'Which platforms and versions are supported?', a: 'Vanilla, Paper, Spigot, Fabric and Forge, from 1.8.8 up to the latest 1.21.4 release. You can deploy multiple servers on different versions at the same time.' },
  { q: 'Can I install plugins and mods?', a: 'Absolutely. Paper and Spigot servers ship with a plugins folder you can manage from the built-in file manager, and Fabric / Forge servers get a mods folder with jar upload support.' },
  { q: 'What happens if my server crashes?', a: 'Every node runs a watchdog that restarts crashed servers automatically, and hourly backups mean you can roll back the world to any snapshot with one click from the panel.' },
  { q: 'Do I need to install anything on my PC?', a: 'No. CraftHost runs entirely in your browser — console, file manager, backups and metrics. Your friends just connect with the standard Minecraft launcher.' },
]

function FloatingBlocks() {
  const blocks = [
    { x: '8%', y: '18%', size: 22, color: '#4faa3d', delay: 0, dur: 5 },
    { x: '86%', y: '12%', size: 16, color: '#7bb661', delay: 0.8, dur: 6 },
    { x: '78%', y: '68%', size: 26, color: '#3d8b2f', delay: 0.4, dur: 5.5 },
    { x: '14%', y: '72%', size: 14, color: '#8a5a38', delay: 1.2, dur: 6.5 },
    { x: '48%', y: '8%', size: 12, color: '#62c04a', delay: 0.2, dur: 7 },
    { x: '92%', y: '42%', size: 18, color: '#5a8d3a', delay: 1.6, dur: 5.2 },
    { x: '4%', y: '45%', size: 12, color: '#d9b44a', delay: 0.6, dur: 6.2 },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {blocks.map((b, i) => (
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
            <CreeperMark size={28} />
            <span className="font-pixel text-sm tracking-tight text-emerald-400">CraftHost</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400" aria-label="Main">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#how" className="hover:text-emerald-400 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>
          <Button onClick={goPanel} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold">
            Open Panel <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-pixel-grid" aria-hidden />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
        <FloatingBlocks />
        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 md:pt-32 md:pb-28 text-center">
          <Badge variant="outline" className="mb-6 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            12,480 servers online right now
          </Badge>
          <h1 className="font-pixel text-2xl sm:text-3xl md:text-5xl leading-relaxed md:leading-relaxed text-zinc-100">
            Your Minecraft server.
            <br />
            <span className="text-emerald-400">Live in 60 seconds.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-zinc-400">
            Spin up Vanilla, Paper, Spigot, Fabric or Forge servers right from your browser.
            Streaming console, plugin manager, live metrics, automatic backups — full control, zero setup.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => openWizard(2048)} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold h-12 px-7 text-base">
              <Zap className="mr-2 h-5 w-5" /> Deploy a server — Free
            </Button>
            <Button size="lg" variant="outline" onClick={goPanel} className="h-12 px-7 text-base border-white/15 hover:bg-white/5 hover:text-emerald-300">
              View the live panel
            </Button>
          </div>
          <p className="mt-4 text-xs text-zinc-500">No credit card · 2 GB free forever · deploy in your browser</p>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              ['99.98%', 'uptime, 90-day avg'],
              ['12,480+', 'servers hosted'],
              ['3.2M', 'players each month'],
              ['6', 'low-latency regions'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="font-pixel text-sm md:text-base text-emerald-400">{v}</div>
                <div className="mt-1.5 text-xs text-zinc-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platforms strip ── */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-zinc-500">
          <span className="text-xs uppercase tracking-widest">Runs</span>
          {PLATFORMS.map((p) => (
            <span key={p.id} className="font-semibold text-zinc-400">{p.label}</span>
          ))}
          <span className="text-zinc-600">+ any custom jar</span>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 md:py-24 w-full">
        <div className="text-center mb-12">
          <h2 className="font-pixel text-lg md:text-2xl text-zinc-100">Everything a server owner needs</h2>
          <p className="mt-4 text-zinc-400">A hosting panel that feels like a game, not a chore.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-white/[0.02] border-white/5 hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-lg md:text-2xl text-zinc-100">Three blocks to success</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative rounded-xl border border-white/5 bg-zinc-950/60 p-6">
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" aria-hidden />
                )}
                <div className="font-pixel text-xl text-emerald-400/80">{s.n}</div>
                <h3 className="mt-4 font-semibold text-zinc-100">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 md:py-24 w-full">
        <div className="text-center mb-12">
          <h2 className="font-pixel text-lg md:text-2xl text-zinc-100">Plans for every world</h2>
          <p className="mt-4 text-zinc-400">Start free. Scale when your SMP outgrows the spawn chunks.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col bg-white/[0.02] ${plan.highlight ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' : 'border-white/5'}`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-500">
                  Most popular
                </Badge>
              )}
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-pixel text-sm text-zinc-100">{plan.name}</h3>
                  <span className="text-xs text-zinc-500">{plan.tagline}</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-pixel text-lg text-emerald-400">{plan.priceLabel}</span>
                  <span className="text-xs text-zinc-500">{plan.period}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                  <Cpu className="h-3.5 w-3.5 text-emerald-500/70" /> {plan.ramMb / 1024} GB RAM
                  <Users className="ml-2 h-3.5 w-3.5 text-emerald-500/70" /> {plan.slots}
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => openWizard(plan.ramMb)}
                  className={`mt-6 w-full font-semibold ${plan.highlight
                    ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                    : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-white/10'}`}
                >
                  Deploy {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <Globe className="h-3.5 w-3.5" /> All plans include DDoS protection, the full panel and instant setup.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <div className="text-center mb-10">
            <h2 className="font-pixel text-lg md:text-2xl text-zinc-100">Questions & answers</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/5">
                <AccordionTrigger className="text-left text-zinc-200 hover:text-emerald-300 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-pixel-grid" aria-hidden />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="font-pixel text-xl md:text-3xl text-zinc-100">Ready to place the first block?</h2>
          <p className="mt-5 text-zinc-400">Your free server is one click and sixty seconds away.</p>
          <Button size="lg" onClick={() => openWizard(2048)} className="mt-8 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold h-12 px-8 text-base">
            <Zap className="mr-2 h-5 w-5" /> Deploy my free server
          </Button>
        </div>
      </section>

      {/* ── Footer (sticky bottom) ── */}
      <footer className="mt-auto border-t border-white/5 bg-zinc-950/80">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CreeperMark size={22} />
            <span className="font-pixel text-xs text-zinc-400">CraftHost</span>
          </div>
          <p className="text-xs text-zinc-600 text-center">
            A fan-made demo panel. Not affiliated with Mojang Studios or Microsoft.
          </p>
          <div className="flex items-center gap-5 text-xs text-zinc-500">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
            <button onClick={goPanel} className="hover:text-emerald-400 transition-colors">Panel</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

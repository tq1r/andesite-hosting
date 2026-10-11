'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Cpu, MemoryStick, Gauge, Users, ArrowDownUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useServerSocket } from '@/hooks/use-server-socket'
import { ramLabel, uptimeLabel, type ServerDTO, type StatsSample } from '@/lib/mc'

const MAX_SAMPLES = 60

interface GraphPoint {
  i: number
  cpu: number
  ram: number
  tps: number
}

export function StatsTab({ server }: { server: ServerDTO }) {
  const [samples, setSamples] = useState<StatsSample[]>([])

  useServerSocket(server.id, {
    onStats: (s) => setSamples((prev) => [...prev, s].slice(-MAX_SAMPLES)),
  })
  // component remounts on server switch via key={server.id}
  const status = server.status

  const latest = samples[samples.length - 1] ?? null
  const data: GraphPoint[] = samples.map((s, i) => ({
    i,
    cpu: Math.round(s.cpu * 10) / 10,
    ram: Math.round(s.ramPct * 10) / 10,
    tps: Math.round(s.tps * 10) / 10,
  }))

  const online = status === 'online'

  const cards = [
    { icon: Cpu, label: 'CPU load', value: latest ? `${latest.cpu.toFixed(1)}%` : '—', sub: 'across all vCores' },
    { icon: MemoryStick, label: 'Memory', value: latest ? `${latest.ramMb} MB` : '—', sub: latest ? `of ${ramLabel(latest.ramTotalMb)} (${latest.ramPct.toFixed(0)}%)` : `of ${ramLabel(server.ramMb)}` },
    { icon: Gauge, label: 'Ticks / sec', value: latest ? latest.tps.toFixed(2) : '—', sub: '20.00 is perfect' },
    { icon: Users, label: 'Players', value: latest ? `${latest.players} / ${latest.playersMax}` : `${server.playersOnline} / ${server.maxPlayers}`, sub: 'connected now' },
    { icon: ArrowDownUp, label: 'Network', value: latest ? `${latest.netIn}↓ ${latest.netOut}↑ kbps` : '—', sub: 'live throughput' },
    { icon: Clock, label: 'Uptime', value: uptimeLabel(latest?.uptimeSec ?? server.uptimeSec), sub: 'since last boot' },
  ]

  const chartTooltipStyle = {
    backgroundColor: '#0c0f0c',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontSize: 12,
    color: '#d4d4d8',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="bg-white/[0.02] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-600">
                <c.icon className="h-3.5 w-3.5 text-emerald-400" /> {c.label}
              </div>
              <div className="mt-2 text-xl font-semibold font-mono text-zinc-100">{c.value}</div>
              <div className="mt-0.5 text-[11px] text-zinc-600">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">CPU load — last {MAX_SAMPLES * 2}s</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          {online ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="i" hide />
                <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
                <ChartTooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v}%`, 'CPU']} labelFormatter={() => ''} />
                <Area type="monotone" dataKey="cpu" stroke="#34d399" strokeWidth={2} fill="url(#cpuFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-zinc-600">
              Server is offline — start it to collect live metrics.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Memory usage %</CardTitle>
          </CardHeader>
          <CardContent className="h-44">
            {online ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="ramFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
                  <ChartTooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v}%`, 'RAM']} labelFormatter={() => ''} />
                  <Area type="monotone" dataKey="ram" stroke="#fbbf24" strokeWidth={2} fill="url(#ramFill)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-600">No data — server offline.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Ticks per second (TPS)</CardTitle>
          </CardHeader>
          <CardContent className="h-44">
            {online ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="tpsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis domain={[16, 20]} tick={{ fill: '#71717a', fontSize: 11 }} />
                  <ChartTooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} tps`, 'TPS']} labelFormatter={() => ''} />
                  <Area type="monotone" dataKey="tps" stroke="#a78bfa" strokeWidth={2} fill="url(#tpsFill)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-600">No data — server offline.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, TerminalSquare, Cpu, MemoryStick, Gauge, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useServerSocket } from '@/hooks/use-server-socket'
import { sendCommand } from '@/lib/api'
import { uptimeLabel, type LogLine, type ServerDTO, type StatsSample } from '@/lib/mc'

const LEVEL_CLASS: Record<string, string> = {
  INFO: 'text-stone-300',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
  CHAT: 'text-emerald-300',
  CMD: 'text-sky-300',
}

function fmtTime(t: number): string {
  const d = new Date(t)
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':')
}

const QUICK_COMMANDS = ['list', 'tps', 'save-all', 'say Hello survivors!', 'help']

export function ConsoleTab({ server }: { server: ServerDTO }) {
  const [lines, setLines] = useState<LogLine[]>([])
  const [stats, setStats] = useState<StatsSample | null>(null)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [engineOnline, setEngineOnline] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickBottom = useRef(true)

  // status is driven by the live-updated server prop (react-query cache ← engine socket)
  const status = server.status

  useServerSocket(server.id, {
    onLogs: (backlog) => {
      setLines(backlog)
      stickBottom.current = true
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
      })
    },
    onLog: (line) => setLines((prev) => [...prev.slice(-399), line]),
    onStats: (s) => setStats(s),
    onEngineChange: setEngineOnline,
  })

  // reset when switching servers happens via key={server.id} on this component in ServerView

  // auto-scroll (only if user is at bottom)
  useEffect(() => {
    const el = scrollRef.current
    if (el && stickBottom.current) el.scrollTop = el.scrollHeight
  }, [lines])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
  }, [])

  const submit = (raw?: string) => {
    const cmd = (raw ?? input).trim()
    if (!cmd || status !== 'online') return
    sendCommand(server.id, cmd)
    setHistory((h) => [cmd, ...h.filter((x) => x !== cmd)].slice(0, 30))
    setHistoryIdx(-1)
    setInput('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length) {
        const next = Math.min(historyIdx + 1, history.length - 1)
        setHistoryIdx(next)
        setInput(history[next])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = historyIdx - 1
      setHistoryIdx(next)
      setInput(next >= 0 ? history[next] : '')
    }
  }

  const online = status === 'online'

  return (
    <div className="space-y-3">
      {/* live stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Cpu, label: 'CPU', value: stats ? `${stats.cpu.toFixed(0)}%` : '—' },
          { icon: MemoryStick, label: 'RAM', value: stats ? `${stats.ramMb} / ${stats.ramTotalMb} MB` : '—' },
          { icon: Gauge, label: 'TPS', value: stats ? stats.tps.toFixed(1) : '—' },
          { icon: Users, label: 'Players', value: stats ? `${stats.players}/${stats.playersMax}` : `${server.playersOnline}/${server.maxPlayers}` },
        ].map((s) => (
          <Card key={s.label} className="bg-white/[0.02] border-white/5">
            <CardContent className="p-3 flex items-center gap-2.5">
              <s.icon className="h-4 w-4 text-orange-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-100 font-mono leading-tight truncate">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-stone-600">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* terminal */}
      <Card className="border-white/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <TerminalSquare className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono">{server.name} — console</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-600">
            {!engineOnline && (
              <span
                className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300"
                title="The live simulation engine is not connected. Run it locally: cd mini-services/mc-engine && bun install && bun run dev"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> engine offline
              </span>
            )}
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`} />
            {online ? `live · up ${uptimeLabel(stats?.uptimeSec ?? server.uptimeSec)}` : status}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="terminal-scroll h-[420px] overflow-y-auto bg-[#0a0d08] px-3 py-2.5 font-mono text-[12.5px] leading-relaxed"
          role="log"
          aria-label="Server console output"
        >
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
              <TerminalSquare className="h-8 w-8 text-stone-700" />
              <p className="text-stone-500 text-[13px]">
                {!engineOnline
                  ? 'Live engine not connected — static deployment?'
                  : status === 'offline'
                    ? 'Server is offline — press Start to boot it up.'
                    : status === 'starting'
                      ? 'Booting… console output will appear here.'
                      : 'Waiting for output…'}
              </p>
              {status === 'offline' && (
                <p className="text-stone-600 text-[11px]">Tip: try the commands <span className="text-orange-500">list</span>, <span className="text-orange-500">say</span> and <span className="text-orange-500">tps</span> once it&apos;s online.</p>
              )}
            </div>
          ) : (
            lines.map((l, i) => (
              <div key={`${l.t}-${i}`} className="whitespace-pre-wrap break-words">
                <span className="text-stone-600">[{fmtTime(l.t)}]</span>{' '}
                <span className="text-stone-500">[{l.th}/{l.lvl}]:</span>{' '}
                <span className={LEVEL_CLASS[l.lvl] ?? 'text-stone-300'}>{l.msg}</span>
              </div>
            ))
          )}
        </div>

        {/* command input */}
        <div className="border-t border-white/5 bg-black/40 px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-orange-400 text-sm select-none">&gt;</span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!online}
              placeholder={online ? 'Type a command… (try: help, list, say, kick, ban, op)' : 'Server must be online to send commands'}
              className="flex-1 h-9 bg-transparent border-white/10 font-mono text-[13px] focus-visible:ring-orange-500/40"
              aria-label="Console command input"
            />
            <Button size="sm" disabled={!online || !input.trim()} onClick={() => submit()} className="bg-orange-500 text-stone-950 hover:bg-orange-400 h-9 px-3">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_COMMANDS.map((c) => (
              <button
                key={c}
                onClick={() => submit(c)}
                disabled={!online}
                className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5 font-mono text-[11px] text-stone-400 hover:border-orange-500/40 hover:text-orange-300 disabled:opacity-40 transition-colors"
              >
                /{c}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

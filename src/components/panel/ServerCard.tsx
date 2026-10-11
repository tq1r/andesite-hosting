'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Play, Square, RotateCw, Settings2, Copy, Users, Cpu } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { powerAction } from '@/lib/api'
import { STATUS_META, platformLabel, ramLabel, serverAddress, type ServerDTO } from '@/lib/mc'
import { useAppStore } from '@/lib/store'

export function ServerCard({ server }: { server: ServerDTO }) {
  const openServer = useAppStore((s) => s.openServer)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const meta = STATUS_META[server.status]
  const ramPct = Math.min(100, Math.round((server.playersOnline / Math.max(1, server.maxPlayers)) * 100))

  const onPower = async (action: 'start' | 'stop' | 'restart') => {
    setBusy(true)
    try {
      if (action === 'start') {
        powerAction(server, 'start')
        toast({ title: `Starting ${server.name}…`, description: 'Watch the console for the boot sequence.' })
      } else {
        powerAction(server, action)
        toast({ title: action === 'stop' ? `Stopping ${server.name}…` : `Restarting ${server.name}…` })
      }
      // refresh to pick up engine status
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['servers'] }), 1200)
    } finally {
      setBusy(false)
    }
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(serverAddress(server))
      toast({ title: 'Address copied', description: serverAddress(server) })
    } catch {
      toast({ title: 'Copy failed', description: serverAddress(server), variant: 'destructive' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white/[0.02] border-white/5 hover:border-emerald-500/25 transition-colors h-full flex flex-col">
        <CardContent className="p-4 flex flex-col flex-1 gap-3">
          {/* header */}
          <div className="flex items-start justify-between gap-2">
            <button onClick={() => openServer(server.id)} className="min-w-0 text-left group">
              <h3 className="font-semibold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors">
                {server.name}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {platformLabel(server.platform)} {server.version} · {server.region}
              </p>
            </button>
            <Badge variant="outline" className={`shrink-0 flex items-center gap-1.5 ${meta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </Badge>
          </div>

          {/* address */}
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 rounded-md border border-white/5 bg-black/30 px-2.5 py-1.5 font-mono text-xs text-zinc-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors w-fit"
            aria-label={`Copy address ${serverAddress(server)}`}
          >
            {serverAddress(server)}
            <Copy className="h-3 w-3 opacity-60" />
          </button>

          {/* bars */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Players</span>
                <span className="font-mono">{server.playersOnline} / {server.maxPlayers}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${ramPct > 80 ? 'bg-red-400' : 'bg-emerald-400'}`}
                  style={{ width: `${ramPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> RAM</span>
                <span className="font-mono">{ramLabel(server.ramMb)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="mt-auto pt-1 flex items-center gap-2">
            {server.status === 'online' ? (
              <>
                <Tooltip><TooltipTrigger asChild>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => onPower('restart')} className="border-white/10 hover:bg-white/5">
                    <RotateCw className="h-3.5 w-3.5 text-amber-300" />
                  </Button>
                </TooltipTrigger><TooltipContent>Restart</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => onPower('stop')} className="border-white/10 hover:bg-white/5">
                    <Square className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </TooltipTrigger><TooltipContent>Stop</TooltipContent></Tooltip>
              </>
            ) : server.status === 'offline' ? (
              <Button size="sm" disabled={busy} onClick={() => onPower('start')} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold flex-1">
                <Play className="mr-1.5 h-3.5 w-3.5" /> Start
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled className="flex-1 border-white/10">
                <span className={`h-2 w-2 rounded-full ${meta.dot} mr-1.5`} /> {meta.label}…
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => openServer(server.id)} className="ml-auto border-white/10 hover:bg-white/5 hover:text-emerald-300">
              <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Manage
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

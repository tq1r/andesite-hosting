'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Play, Square, RotateCw, Skull, Copy, TerminalSquare, Activity,
  Users, FolderCog, HardDriveDownload, Settings2, Puzzle, CalendarClock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { powerAction } from '@/lib/api'
import { STATUS_META, platformLabel, ramLabel, serverAddress, uptimeLabel, type ServerDTO } from '@/lib/mc'
import { useAppStore } from '@/lib/store'
import { ConsoleTab } from '@/components/panel/tabs/ConsoleTab'
import { StatsTab } from '@/components/panel/tabs/StatsTab'
import { PlayersTab } from '@/components/panel/tabs/PlayersTab'
import { FilesTab } from '@/components/panel/tabs/FilesTab'
import { BackupsTab } from '@/components/panel/tabs/BackupsTab'
import { SettingsTab } from '@/components/panel/tabs/SettingsTab'
import { PluginsTab } from '@/components/panel/tabs/PluginsTab'
import { SchedulesTab } from '@/components/panel/tabs/SchedulesTab'

export function ServerView({ server }: { server: ServerDTO }) {
  const closeServer = useAppStore((s) => s.closeServer)
  const { toast } = useToast()
  const [tab, setTab] = useState('console')
  const meta = STATUS_META[server.status]
  const isOnline = server.status === 'online'
  const isBusy = server.status === 'starting' || server.status === 'stopping'

  const onPower = (action: 'start' | 'stop' | 'restart' | 'kill') => {
    powerAction(server, action)
    const labels = { start: 'Starting', stop: 'Stopping', restart: 'Restarting', kill: 'Force killing' }
    toast({ title: `${labels[action]} ${server.name}…` })
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
    <motion.div key={server.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={closeServer} className="text-stone-400 hover:text-stone-100" aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-semibold text-stone-100 truncate">{server.name}</h1>
            <Badge variant="outline" className={`flex items-center gap-1.5 ${meta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <span>{platformLabel(server.platform)} {server.version}</span>
            <span className="text-stone-700">·</span>
            <span>{ramLabel(server.ramMb)} RAM</span>
            <span className="text-stone-700">·</span>
            <span>uptime {uptimeLabel(server.uptimeSec)}</span>
          </div>
        </div>

        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-xs text-stone-400 hover:text-orange-300 hover:border-orange-500/30 transition-colors"
          aria-label={`Copy address ${serverAddress(server)}`}
        >
          {serverAddress(server)}
          <Copy className="h-3 w-3 opacity-60" />
        </button>

        {/* Power controls */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Power controls">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                disabled={server.status !== 'offline'}
                onClick={() => onPower('start')}
                className="bg-orange-500 text-stone-950 hover:bg-orange-400 font-semibold"
              >
                <Play className="mr-1 h-3.5 w-3.5" /> Start
              </Button>
            </TooltipTrigger>
            <TooltipContent>Boot the server</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" disabled={!isOnline && !isBusy} onClick={() => onPower('restart')} className="border-white/10 hover:bg-white/5">
                <RotateCw className="mr-1 h-3.5 w-3.5 text-amber-300" /> Restart
              </Button>
            </TooltipTrigger>
            <TooltipContent>Graceful restart</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" disabled={!isOnline && !isBusy} onClick={() => onPower('stop')} className="border-white/10 hover:bg-white/5">
                <Square className="mr-1 h-3.5 w-3.5 text-red-400" /> Stop
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save the world and shut down</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" disabled={server.status === 'offline'} onClick={() => onPower('kill')} className="border-white/10 hover:bg-white/5" aria-label="Kill server">
                <Skull className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-red-950 border-red-800 text-red-200">Force kill (data may be lost)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="bg-white/[0.03] border border-white/5 h-auto p-1 flex flex-wrap gap-1">
          <TabsTrigger value="console" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
            <TerminalSquare className="h-4 w-4" /> Console
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
            <Activity className="h-4 w-4" /> Stats
          </TabsTrigger>
          <TabsTrigger value="players" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
            <Users className="h-4 w-4" /> Players
            {server.playersOnline > 0 && (
              <span className="ml-0.5 rounded-full bg-orange-500/20 text-orange-300 px-1.5 text-[10px] font-mono">
                {server.playersOnline}
              </span>
            )}
          </TabsTrigger>
          {server.platform !== 'vanilla' && (
            <TabsTrigger value="plugins" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
              <Puzzle className="h-4 w-4" /> {server.platform === 'fabric' || server.platform === 'forge' ? 'Mods' : 'Plugins'}
              {server.plugins?.length > 0 && (
                <span className="ml-0.5 rounded-full bg-orange-500/20 text-orange-300 px-1.5 text-[10px] font-mono">
                  {server.plugins.length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="schedules" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
            <CalendarClock className="h-4 w-4" /> Schedules
          </TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
            <FolderCog className="h-4 w-4" /> Files
          </TabsTrigger>
          <TabsTrigger value="backups" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
            <HardDriveDownload className="h-4 w-4" /> Backups
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-300 gap-1.5">
            <Settings2 className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {tab === 'console' && <ConsoleTab server={server} />}
        {tab === 'stats' && <StatsTab server={server} />}
        {tab === 'players' && <PlayersTab server={server} />}
        {tab === 'plugins' && <PluginsTab server={server} />}
        {tab === 'schedules' && <SchedulesTab server={server} />}
        {tab === 'files' && <FilesTab server={server} />}
        {tab === 'backups' && <BackupsTab server={server} />}
        {tab === 'settings' && <SettingsTab server={server} />}
      </div>
    </motion.div>
  )
}

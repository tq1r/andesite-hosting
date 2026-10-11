'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreeperMark } from '@/components/CreeperMark'
import { PixelAvatar } from '@/components/PixelAvatar'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { useAppStore } from '@/lib/store'
import { STATUS_META, platformLabel, type ServerDTO } from '@/lib/mc'
import { DashboardView } from '@/components/panel/DashboardView'
import { ServerView } from '@/components/panel/ServerView'
import { CreateServerWizard } from '@/components/panel/CreateServerWizard'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: () => api<{ servers: ServerDTO[] }>('/api/servers').then((r) => r.servers),
  })
}

export function Panel() {
  const activeServerId = useAppStore((s) => s.activeServerId)
  const openServer = useAppStore((s) => s.openServer)
  const closeServer = useAppStore((s) => s.closeServer)
  const goLanding = useAppStore((s) => s.goLanding)
  const openWizard = useAppStore((s) => s.openWizard)
  const queryClient = useQueryClient()
  const { data: servers = [] } = useServers()

  // Live engine status → react-query cache
  useEffect(() => {
    const socket = getSocket()
    const onStatusChanged = (d: {
      serverId: string
      status: ServerDTO['status']
      playersOnline: number
      playersMax: number
      uptimeSec: number
    }) => {
      queryClient.setQueryData<ServerDTO[]>(['servers'], (old) =>
        old?.map((s) =>
          s.id === d.serverId
            ? { ...s, status: d.status, playersOnline: d.playersOnline, maxPlayers: d.playersMax, uptimeSec: d.uptimeSec }
            : s
        )
      )
      queryClient.setQueryData<{ server: ServerDTO }>(['server', d.serverId], (old) =>
        old
          ? {
              server: {
                ...old.server,
                status: d.status,
                playersOnline: d.playersOnline,
                maxPlayers: d.playersMax,
                uptimeSec: d.uptimeSec,
              },
            }
          : old
      )
    }
    socket.on('status-changed', onStatusChanged)
    return () => {
      socket.off('status-changed', onStatusChanged)
    }
  }, [queryClient])

  const active = servers.find((s) => s.id === activeServerId) ?? null

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-white/5 bg-background/85 backdrop-blur-md">
        <div className="h-full px-4 flex items-center justify-between gap-3">
          <button onClick={closeServer} className="flex items-center gap-2.5 group" aria-label="CraftHost home">
            <CreeperMark size={26} />
            <span className="font-pixel text-xs sm:text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors">
              CraftHost
            </span>
          </button>

          {/* Mobile server switcher */}
          <div className="lg:hidden flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={closeServer}
              className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${!activeServerId ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-zinc-400'}`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </button>
            {servers.map((s) => (
              <button
                key={s.id}
                onClick={() => openServer(s.id)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${s.id === activeServerId ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-zinc-400'}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s.status].dot}`} />
                {s.name.length > 18 ? s.name.slice(0, 18) + '…' : s.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => openWizard()} size="sm" className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold">
              <Plus className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Create server</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-1 ring-white/10 hover:ring-emerald-500/50 transition-colors" aria-label="Account menu">
                  <PixelAvatar name="Steve" size={32} className="rounded-full" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-zinc-500">Signed in as</DropdownMenuLabel>
                <DropdownMenuLabel>Steve</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={goLanding} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Back to site
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="p-3 space-y-1" aria-label="Servers">
            <button
              onClick={closeServer}
              className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${!activeServerId ? 'bg-emerald-500/10 text-emerald-300' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>

            <div className="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Your servers · {servers.length}
            </div>
            {servers.map((s) => (
              <button
                key={s.id}
                onClick={() => openServer(s.id)}
                className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${s.id === activeServerId ? 'bg-emerald-500/10 text-emerald-300' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_META[s.status].dot}`} />
                <span className="truncate text-left">{s.name}</span>
                <span className="ml-auto text-[10px] text-zinc-600 shrink-0">{platformLabel(s.platform)}</span>
              </button>
            ))}
            {servers.length === 0 && (
              <p className="px-3 py-2 text-xs text-zinc-600">No servers yet. Create your first one!</p>
            )}
          </nav>

          <div className="mt-auto p-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-zinc-500">
              <div className="flex items-center justify-between">
                <span>Nodes online</span>
                <span className="text-emerald-400">6 / 6</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span>Engine</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> healthy
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0">
          {active ? <ServerView key={active.id} server={active} /> : activeServerId ? null : <DashboardView servers={servers} />}
        </main>
      </div>

      <CreateServerWizard />
    </div>
  )
}

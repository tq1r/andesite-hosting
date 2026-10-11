'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  Server as ServerIcon, Activity, Users, Cpu, Zap, Database, Settings2,
  UserPlus, Trash2, ShieldBan, RotateCcw, HardDriveDownload, Rocket,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AndesiteMark } from '@/components/AndesiteMark'
import { api } from '@/lib/api'
import { ramLabel, type ActivityDTO, type ServerDTO } from '@/lib/mc'
import { useAppStore } from '@/lib/store'
import { ServerCard } from '@/components/panel/ServerCard'

const ACTIVITY_ICONS: Record<string, { icon: typeof Rocket; className: string }> = {
  created: { icon: Rocket, className: 'text-orange-400 bg-orange-500/10' },
  started: { icon: Zap, className: 'text-amber-300 bg-amber-500/10' },
  stopped: { icon: Zap, className: 'text-stone-400 bg-stone-500/10' },
  deleted: { icon: Trash2, className: 'text-red-400 bg-red-500/10' },
  settings: { icon: Settings2, className: 'text-sky-300 bg-sky-500/10' },
  backup: { icon: HardDriveDownload, className: 'text-violet-300 bg-violet-500/10' },
  restore: { icon: RotateCcw, className: 'text-violet-300 bg-violet-500/10' },
  player: { icon: ShieldBan, className: 'text-orange-300 bg-orange-500/10' },
}

function ActivityIcon({ type }: { type: string }) {
  const meta = ACTIVITY_ICONS[type] ?? { icon: Activity, className: 'text-stone-400 bg-stone-500/10' }
  return (
    <span className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${meta.className}`}>
      <meta.icon className="h-3.5 w-3.5" />
    </span>
  )
}

export function DashboardView({ servers }: { servers: ServerDTO[] }) {
  const openWizard = useAppStore((s) => s.openWizard)
  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api<{ activity: ActivityDTO[] }>('/api/activity?limit=15').then((r) => r.activity),
    refetchInterval: 20_000,
  })

  const online = servers.filter((s) => s.status === 'online').length
  const playersOnline = servers.reduce((a, s) => a + s.playersOnline, 0)
  const ramAllocated = servers.reduce((a, s) => a + s.ramMb, 0)

  const stats = [
    { label: 'Servers', value: String(servers.length), icon: ServerIcon },
    { label: 'Online', value: `${online}/${servers.length}`, icon: Zap },
    { label: 'Players online', value: String(playersOnline), icon: Users },
    { label: 'RAM allocated', value: ramLabel(ramAllocated), icon: Cpu },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="bg-white/[0.02] border-white/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <s.icon className="h-4.5 w-4.5 text-orange-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-semibold text-stone-100 leading-tight truncate">{s.value}</div>
                <div className="text-xs text-stone-500 truncate">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Server grid */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Your servers</h2>
            <Button size="sm" variant="outline" onClick={() => openWizard()} className="border-white/10 hover:bg-white/5 hover:text-orange-300">
              <Zap className="mr-1.5 h-3.5 w-3.5 text-orange-400" /> New server
            </Button>
          </div>

          {servers.length === 0 ? (
            <Card className="border-dashed border-white/10 bg-white/[0.01]">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <AndesiteMark size={56} className="opacity-80" />
                <h3 className="mt-6 font-display text-sm text-stone-200">No servers yet</h3>
                <p className="mt-3 text-sm text-stone-500 max-w-sm">
                  Deploy your first Minecraft server — free 2 GB tier, online in about a minute. Vanilla, Paper, Spigot, Fabric or Forge.
                </p>
                <Button onClick={() => openWizard(2048)} className="mt-6 bg-orange-500 text-stone-950 hover:bg-orange-400 font-semibold">
                  <Rocket className="mr-2 h-4 w-4" /> Deploy your first server
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {servers.map((s) => (
                <ServerCard key={s.id} server={s} />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Recent activity</h2>
          <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-2">
              {activityLoading ? (
                <div className="space-y-3 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-7 w-7 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-4/5" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="p-4 text-sm text-stone-600 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Nothing here yet — deploy a server to get started.
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {activity.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 px-3 py-3">
                      <ActivityIcon type={a.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-stone-300 leading-snug">{a.message}</p>
                        <p className="mt-0.5 text-[11px] text-stone-600">
                          {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-200">
                <Database className="h-4 w-4 text-orange-400" /> Storage
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  ['Worlds', '48.2 GB / 250 GB'],
                  ['Backups', '112.9 GB / 500 GB'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-stone-500">{k}</span>
                    <span className="text-stone-300 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

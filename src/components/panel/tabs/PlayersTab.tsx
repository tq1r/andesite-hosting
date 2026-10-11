'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { UserX, ShieldCheck, ShieldOff, Ban, RotateCcw, MoreHorizontal, UserRoundCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PixelAvatar } from '@/components/PixelAvatar'
import { useToast } from '@/hooks/use-toast'
import { useServerSocket } from '@/hooks/use-server-socket'
import { api, sendCommand } from '@/lib/api'
import type { PlayerDTO, ServerDTO } from '@/lib/mc'

export function PlayersTab({ server }: { server: ServerDTO }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [liveOnline, setLiveOnline] = useState<string[] | null>(null)

  useServerSocket(server.id, {
    onPlayers: (names) => setLiveOnline(names),
  })

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players', server.id],
    queryFn: () => api<{ players: PlayerDTO[] }>(`/api/servers/${server.id}/players`).then((r) => r.players),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<PlayerDTO, 'isOp' | 'isBanned' | 'isWhitelisted'>> }) =>
      api(`/api/players/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', server.id] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })

  const onlineNames = liveOnline ?? players.filter((p) => p.isOnline).map((p) => p.name)
  const onlineSet = new Set(onlineNames)

  const kick = (name: string) => {
    sendCommand(server.id, `kick ${name}`)
    toast({ title: `Kicked ${name}`, description: 'Watch the console for the disconnect.' })
  }

  const banPlayer = (p: PlayerDTO) => {
    updateMutation.mutate({ id: p.id, patch: { isBanned: true } })
    if (onlineSet.has(p.name)) sendCommand(server.id, `ban ${p.name}`)
    toast({ title: `Banned ${p.name}`, variant: 'destructive' })
  }

  const unban = (p: PlayerDTO) => {
    updateMutation.mutate({ id: p.id, patch: { isBanned: false } })
    sendCommand(server.id, `pardon ${p.name}`)
    toast({ title: `Unbanned ${p.name}` })
  }

  const toggleOp = (p: PlayerDTO) => {
    updateMutation.mutate({ id: p.id, patch: { isOp: !p.isOp } })
    if (onlineSet.has(p.name)) sendCommand(server.id, p.isOp ? `deop ${p.name}` : `op ${p.name}`)
    toast({ title: p.isOp ? `${p.name} is no longer an operator` : `${p.name} is now an operator` })
  }

  return (
    <div className="space-y-4">
      {/* Online now */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <UserRoundCheck className="h-4 w-4 text-emerald-400" /> Online now
            <span className="ml-1 font-mono text-xs text-zinc-500">{onlineNames.length} connected</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onlineNames.length === 0 ? (
            <p className="text-sm text-zinc-600 py-2">No players connected. The server simulates players joining a minute or so after boot.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onlineNames.map((name) => {
                const known = players.find((p) => p.name === name)
                return (
                  <div key={name} className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] pl-1.5 pr-2.5 py-1.5">
                    <PixelAvatar name={name} size={22} className="rounded-full" />
                    <span className="text-sm text-zinc-200">{name}</span>
                    {known?.isOp && <ShieldCheck className="h-3 w-3 text-emerald-400" aria-label="operator" />}
                    <button
                      onClick={() => kick(name)}
                      disabled={server.status !== 'online'}
                      className="ml-1 rounded-full p-1 text-zinc-500 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-30 transition-colors"
                      aria-label={`Kick ${name}`}
                      title={`Kick ${name}`}
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Known players */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-300">Known players ({players.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-zinc-500">Player</TableHead>
                    <TableHead className="text-zinc-500 hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-zinc-500 hidden md:table-cell text-right">Joins</TableHead>
                    <TableHead className="text-zinc-500 hidden md:table-cell text-right">Playtime</TableHead>
                    <TableHead className="text-zinc-500 hidden lg:table-cell">Last seen</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => (
                    <TableRow key={p.id} className="border-white/5">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <PixelAvatar name={p.name} size={28} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-200">{p.name}</span>
                              {onlineSet.has(p.name) && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="online" />
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono">{p.uuid.slice(0, 13)}…</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {p.isOp && <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15 border-0 text-[10px] px-1.5">OP</Badge>}
                          {p.isWhitelisted && <Badge className="bg-sky-500/15 text-sky-300 hover:bg-sky-500/15 border-0 text-[10px] px-1.5">WHITELIST</Badge>}
                          {p.isBanned && <Badge className="bg-red-500/15 text-red-300 hover:bg-red-500/15 border-0 text-[10px] px-1.5">BANNED</Badge>}
                          {!p.isOp && !p.isBanned && !p.isWhitelisted && <span className="text-xs text-zinc-600">regular</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono text-zinc-400">{p.joins}</TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono text-zinc-400">
                        {p.playTimeMin >= 60 ? `${Math.floor(p.playTimeMin / 60)}h ${p.playTimeMin % 60}m` : `${p.playTimeMin}m`}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-zinc-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {onlineSet.has(p.name) ? 'now' : formatDistanceToNow(new Date(p.lastSeen), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200" aria-label={`Actions for ${p.name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {p.isOp ? (
                              <DropdownMenuItem onClick={() => toggleOp(p)} className="cursor-pointer">
                                <ShieldOff className="mr-2 h-4 w-4" /> Remove OP
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => toggleOp(p)} className="cursor-pointer">
                                <ShieldCheck className="mr-2 h-4 w-4" /> Make operator
                              </DropdownMenuItem>
                            )}
                            {p.isBanned ? (
                              <DropdownMenuItem onClick={() => unban(p)} className="cursor-pointer">
                                <RotateCcw className="mr-2 h-4 w-4" /> Unban
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => banPlayer(p)} className="cursor-pointer text-red-400 focus:text-red-300">
                                <Ban className="mr-2 h-4 w-4" /> Ban player
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateMutation.mutate({ id: p.id, patch: { isWhitelisted: !p.isWhitelisted } })}
                              className="cursor-pointer"
                            >
                              {p.isWhitelisted ? 'Remove from whitelist' : 'Add to whitelist'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

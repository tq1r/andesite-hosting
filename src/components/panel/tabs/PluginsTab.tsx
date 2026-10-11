'use client'

import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Puzzle, Download, Trash2, Loader2, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { PLUGIN_CATEGORIES, pluginsForPlatform, type ServerDTO } from '@/lib/mc'

export function PluginsTab({ server }: { server: ServerDTO }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('All')

  const isMods = server.platform === 'fabric' || server.platform === 'forge'
  const label = isMods ? 'Mods' : 'Plugins'

  const { data: installed = [], isLoading } = useQuery({
    queryKey: ['plugins', server.id],
    queryFn: () => api<{ installed: string[] }>(`/api/servers/${server.id}/plugins`).then((r) => r.installed),
  })

  const catalog = useMemo(() => pluginsForPlatform(server.platform), [server.platform])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return catalog.filter((p) => {
      if (category !== 'All' && p.category !== category) return false
      if (q && !`${p.name} ${p.author} ${p.desc}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [catalog, category, search])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['plugins', server.id] })
    queryClient.invalidateQueries({ queryKey: ['files', server.id] })
    queryClient.invalidateQueries({ queryKey: ['servers'] })
    queryClient.invalidateQueries({ queryKey: ['server', server.id] })
    queryClient.invalidateQueries({ queryKey: ['activity'] })
  }

  const actionMutation = useMutation({
    mutationFn: ({ pluginId, action }: { pluginId: string; action: 'install' | 'uninstall' }) =>
      api(`/api/servers/${server.id}/plugins`, { method: 'POST', body: JSON.stringify({ pluginId, action }) }),
    onSuccess: (_r, vars) => {
      invalidate()
      const item = catalog.find((p) => p.id === vars.pluginId)
      toast({
        title: vars.action === 'install' ? `${item?.name} installed` : `${item?.name} removed`,
        description:
          vars.action === 'install'
            ? server.status === 'online'
              ? `Placed in /${isMods ? 'mods' : 'plugins'} — restart the server to load it.`
              : `Placed in /${isMods ? 'mods' : 'plugins'}. It loads on next boot.`
            : 'The jar was deleted from the server.',
      })
    },
    onError: (e) => toast({ title: 'Action failed', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      {/* search + filters */}
      <Card className="bg-white/[0.02] border-white/5">
        <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="pl-8 bg-white/[0.03] border-white/10"
              aria-label={`Search ${label}`}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PLUGIN_CATEGORIES.filter((c) => c === 'All' || catalog.some((p) => p.category === c)).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  category === c
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 text-zinc-500 hover:text-zinc-300 hover:border-white/25'
                }`}
                aria-pressed={category === c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* installed strip */}
      {!isLoading && installed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="text-zinc-400 font-medium">{installed.length} {label.toLowerCase()} installed:</span>
          {installed.map((n) => (
            <Badge key={n} variant="outline" className="border-emerald-800/60 bg-emerald-950/40 text-emerald-300 font-normal">
              {n}
            </Badge>
          ))}
        </div>
      )}

      {/* catalog grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-white/[0.02] border-white/5">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/5">
          <CardContent className="py-14 flex flex-col items-center text-center gap-2">
            <Puzzle className="h-9 w-9 text-zinc-700" />
            <p className="text-sm text-zinc-500">Nothing matches “{search}”.</p>
            <p className="text-xs text-zinc-600">Try a different keyword or category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const isInstalled = installed.includes(p.name)
            const busy = actionMutation.isPending && actionMutation.variables?.pluginId === p.id
            return (
              <Card key={p.id} className="bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="flex h-full flex-col gap-2.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-zinc-100 truncate">{p.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        by {p.author} · v{p.version}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-white/10 bg-white/[0.03] text-zinc-400 text-[10px]">
                      {p.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed flex-1">{p.desc}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-600 font-mono">
                      ↓ {p.downloads} · {(p.sizeKb / 1024).toFixed(1)} MB
                    </span>
                    {isInstalled ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <Check className="h-3.5 w-3.5" /> Installed
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => actionMutation.mutate({ pluginId: p.id, action: 'uninstall' })}
                          className="h-7 w-7 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                          aria-label={`Uninstall ${p.name}`}
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => actionMutation.mutate({ pluginId: p.id, action: 'install' })}
                        className="h-7 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
                      >
                        {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />}
                        Install
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

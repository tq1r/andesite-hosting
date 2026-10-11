'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, AlertTriangle, Trash2, Swords, KeyRound, ListChecks } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { api, sendCommand } from '@/lib/api'
import {
  VERSIONS, REGIONS, GAMEMODES, DIFFICULTIES, WORLD_TYPES,
  ramLabel, platformLabel, type ServerDTO,
} from '@/lib/mc'
import { useAppStore } from '@/lib/store'

export function SettingsTab({ server }: { server: ServerDTO }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const closeServer = useAppStore((s) => s.closeServer)

  const [name, setName] = useState(server.name)
  const [motd, setMotd] = useState(server.motd)
  const [maxPlayers, setMaxPlayers] = useState(server.maxPlayers)
  const [ramMb, setRamMb] = useState(server.ramMb)
  const [region, setRegion] = useState(server.region)
  const [gamemode, setGamemode] = useState(server.gamemode)
  const [difficulty, setDifficulty] = useState(server.difficulty)
  const [worldType, setWorldType] = useState(server.worldType)
  const [pvp, setPvp] = useState(server.pvp)
  const [onlineMode, setOnlineMode] = useState(server.onlineMode)
  const [whitelist, setWhitelist] = useState(server.whitelist)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // resync when server prop changes (e.g. after refetch)
  useEffect(() => {
    setName(server.name)
    setMotd(server.motd)
    setMaxPlayers(server.maxPlayers)
    setRamMb(server.ramMb)
    setRegion(server.region)
    setGamemode(server.gamemode)
    setDifficulty(server.difficulty)
    setWorldType(server.worldType)
    setPvp(server.pvp)
    setOnlineMode(server.onlineMode)
    setWhitelist(server.whitelist)
  }, [server])

  const dirty =
    name !== server.name || motd !== server.motd || maxPlayers !== server.maxPlayers ||
    ramMb !== server.ramMb || region !== server.region || gamemode !== server.gamemode ||
    difficulty !== server.difficulty || worldType !== server.worldType ||
    pvp !== server.pvp || onlineMode !== server.onlineMode || whitelist !== server.whitelist

  const saveMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      api(`/api/servers/${server.id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: ['server', server.id] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      if (server.status === 'online') {
        sendCommand(server.id, 'say [CraftHost] Settings updated — restart to apply changes.')
      }
      toast({ title: 'Settings saved', description: server.status === 'online' ? 'Restart the server to apply gameplay changes.' : undefined })
    },
    onError: (e) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api(`/api/servers/${server.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      closeServer()
      toast({ title: 'Server deleted', description: `${server.name} has been removed.` })
    },
  })

  const save = () =>
    saveMutation.mutate({
      name: name.trim() || server.name,
      motd: motd.trim() || server.motd,
      maxPlayers,
      ramMb,
      region,
      gamemode,
      difficulty,
      worldType,
      pvp,
      onlineMode,
      whitelist,
    })

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Identity */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-zinc-300">Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-name">Server name</Label>
            <Input id="set-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className="bg-white/[0.03] border-white/10" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="set-motd">MOTD — shown in the server list</Label>
              <span className="text-[11px] text-zinc-600 font-mono">{motd.length}/59</span>
            </div>
            <Input id="set-motd" value={motd} maxLength={59} onChange={(e) => setMotd(e.target.value)} className="bg-white/[0.03] border-white/10" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label>Platform (fixed)</Label>
              <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-zinc-400">
                {platformLabel(server.platform)} — reinstall required to change
              </div>
            </div>
            <div className="space-y-2">
              <Label>Version</Label>
              <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-zinc-400">
                {server.version} — reinstall required to change
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-zinc-300">Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Memory</Label>
              <span className="font-mono text-sm text-emerald-400">{ramLabel(ramMb)}</span>
            </div>
            <Slider value={[ramMb]} min={1024} max={16384} step={1024} onValueChange={([v]) => setRamMb(v)} aria-label="Memory" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Player slots</Label>
              <span className="font-mono text-sm text-emerald-400">{maxPlayers}</span>
            </div>
            <Slider value={[maxPlayers]} min={2} max={100} step={1} onValueChange={([v]) => setMaxPlayers(v)} aria-label="Player slots" />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10">
                {REGIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label} · ~{r.ping} ms</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-zinc-600">Changing region triggers a migration on next restart.</p>
          </div>
        </CardContent>
      </Card>

      {/* Gameplay */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-zinc-300">Gameplay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Gamemode</Label>
              <Select value={gamemode} onValueChange={setGamemode}>
                <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10">
                  {GAMEMODES.map((g) => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10">
                  {DIFFICULTIES.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>World type</Label>
              <Select value={worldType} onValueChange={setWorldType}>
                <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10">
                  {WORLD_TYPES.map((w) => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5"><Swords className="h-3.5 w-3.5 text-zinc-500" /> PvP</div>
                <div className="text-xs text-zinc-600">Combat between players</div>
              </div>
              <Switch checked={pvp} onCheckedChange={setPvp} aria-label="Toggle PvP" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-zinc-500" /> Whitelist</div>
                <div className="text-xs text-zinc-600">Invite-only access</div>
              </div>
              <Switch checked={whitelist} onCheckedChange={setWhitelist} aria-label="Toggle whitelist" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5 text-zinc-500" /> Online mode</div>
                <div className="text-xs text-zinc-600">Verify premium accounts</div>
              </div>
              <Switch checked={onlineMode} onCheckedChange={setOnlineMode} aria-label="Toggle online mode" />
            </div>
          </div>

          {dirty && (
            <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              You have unsaved changes. {server.status === 'online' && 'A restart is required for gameplay changes to take effect.'}
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={save} disabled={!dirty || saveMutation.isPending} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold">
              <Save className="mr-1.5 h-4 w-4" /> {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-500/20 bg-red-500/[0.03]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500 max-w-md">
            Deleting removes the world, players, files and backups for <span className="text-zinc-300">{server.name}</span>. This cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="bg-red-600 hover:bg-red-500">
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete server
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{server.name}” permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              The world, plugins, player data and every backup will be destroyed. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Keep my server</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Yes, delete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

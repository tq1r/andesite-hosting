'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  CalendarClock, Plus, Play, Trash2, Pencil, HardDriveDownload, RotateCw, TerminalSquare,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { CADENCE_OPTIONS, cadenceLabel, type ScheduleDTO, type ServerDTO } from '@/lib/mc'

const ACTION_META: Record<string, { label: string; icon: typeof RotateCw; badge: string }> = {
  backup: { label: 'Create backup', icon: HardDriveDownload, badge: 'border-amber-800/60 bg-amber-950/40 text-amber-300' },
  restart: { label: 'Restart server', icon: RotateCw, badge: 'border-sky-800/60 bg-sky-950/40 text-sky-300' },
  command: { label: 'Run command', icon: TerminalSquare, badge: 'border-orange-800/60 bg-orange-950/40 text-orange-300' },
}

interface ScheduleDraft {
  name: string
  everyMin: number
  action: 'backup' | 'restart' | 'command'
  payload: string
  enabled: boolean
}

const blankDraft: ScheduleDraft = { name: '', everyMin: 1440, action: 'backup', payload: 'say Daily restart soon!', enabled: true }

export function SchedulesTab({ server }: { server: ServerDTO }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<ScheduleDTO | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<ScheduleDraft>(blankDraft)
  const [deleteTarget, setDeleteTarget] = useState<ScheduleDTO | null>(null)

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules', server.id],
    queryFn: () => api<{ schedules: ScheduleDTO[] }>(`/api/servers/${server.id}/schedules`).then((r) => r.schedules),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['schedules', server.id] })
    queryClient.invalidateQueries({ queryKey: ['activity'] })
    queryClient.invalidateQueries({ queryKey: ['backups', server.id] })
  }

  const saveMutation = useMutation({
    mutationFn: (d: ScheduleDraft) =>
      editTarget
        ? api(`/api/schedules/${editTarget.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: d.name, everyMin: d.everyMin, action: d.action, payload: d.payload || null, enabled: d.enabled }),
          })
        : api(`/api/servers/${server.id}/schedules`, { method: 'POST', body: JSON.stringify(d) }),
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      setEditTarget(null)
      toast({ title: editTarget ? 'Schedule updated' : 'Schedule created', description: 'The engine watchdog will run it automatically.' })
    },
    onError: (e) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api(`/api/schedules/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
    onSuccess: invalidate,
  })

  const runNowMutation = useMutation({
    mutationFn: (id: string) => api<{ result: string }>(`/api/schedules/${id}/run`, { method: 'POST' }),
    onSuccess: (r) => {
      invalidate()
      toast({ title: 'Task ran', description: r.result })
    },
    onError: (e) => toast({ title: 'Run failed', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/schedules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
      toast({ title: 'Schedule deleted' })
    },
  })

  const openCreate = () => {
    setDraft(blankDraft)
    setEditTarget(null)
    setCreateOpen(true)
  }

  const openEdit = (s: ScheduleDTO) => {
    setDraft({ name: s.name, everyMin: s.everyMin, action: s.action as ScheduleDraft['action'], payload: s.payload ?? '', enabled: s.enabled })
    setEditTarget(s)
    setCreateOpen(true)
  }

  const draftValid = draft.name.trim().length > 0 && (draft.action !== 'command' || draft.payload.trim().length > 0)

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="bg-white/[0.02] border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
            <CalendarClock className="h-4 w-4 text-orange-400" /> Scheduled tasks
            <span className="font-mono text-xs text-stone-500">({schedules.length})</span>
          </div>
          <Button size="sm" onClick={openCreate} className="bg-orange-500 text-stone-950 hover:bg-orange-400 font-semibold">
            <Plus className="mr-1 h-4 w-4" /> New task
          </Button>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-14 flex flex-col items-center text-center gap-2">
              <CalendarClock className="h-9 w-9 text-stone-700" />
              <p className="text-sm text-stone-500">No scheduled tasks yet.</p>
              <p className="text-xs text-stone-600 max-w-sm">
                Automate the boring stuff — nightly world backups, morning restarts, or recurring commands like
                <span className="font-mono text-stone-500"> say Event starting!</span> Tasks run even when this tab is closed.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {schedules.map((s) => {
                const meta = ACTION_META[s.action] ?? ACTION_META.command
                const Icon = meta.icon
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${meta.badge}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-stone-200 truncate">{s.name}</p>
                        <Badge variant="outline" className={`text-[10px] ${meta.badge}`}>{meta.label}</Badge>
                        {!s.enabled && (
                          <Badge variant="outline" className="text-[10px] border-stone-700 bg-stone-900 text-stone-500">Paused</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        {cadenceLabel(s.everyMin)}
                        {s.action === 'command' && s.payload ? ` · /${s.payload}` : ''}
                        {s.lastRunAt
                          ? ` · last run ${format(new Date(s.lastRunAt), 'MMM d HH:mm')}${s.lastResult ? ` — ${s.lastResult}` : ''}`
                          : ' · never ran'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: s.id, enabled: v })}
                        aria-label={`${s.enabled ? 'Pause' : 'Enable'} ${s.name}`}
                      />
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => runNowMutation.mutate(s.id)}
                        disabled={runNowMutation.isPending && runNowMutation.variables === s.id}
                        className="h-8 w-8 p-0 text-stone-500 hover:text-orange-300 hover:bg-orange-500/10"
                        aria-label={`Run ${s.name} now`}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost" onClick={() => openEdit(s)}
                        className="h-8 w-8 p-0 text-stone-500 hover:text-stone-200 hover:bg-white/5"
                        aria-label={`Edit ${s.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}
                        className="h-8 w-8 p-0 text-stone-600 hover:text-red-400 hover:bg-red-500/10"
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* create / edit dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && (setCreateOpen(false), setEditTarget(null))}>
        <DialogContent className="max-w-md bg-stone-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display text-xs text-orange-400">
              {editTarget ? 'EDIT SCHEDULED TASK' : 'NEW SCHEDULED TASK'}
            </DialogTitle>
            <DialogDescription>Automate backups, restarts and commands</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sch-name">Task name</Label>
              <Input
                id="sch-name"
                value={draft.name}
                maxLength={40}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nightly backup"
                className="bg-white/[0.03] border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sch-cadence">Runs</Label>
                <Select value={String(draft.everyMin)} onValueChange={(v) => setDraft({ ...draft, everyMin: Number(v) })}>
                  <SelectTrigger id="sch-cadence" className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-stone-950 border-white/10">
                    {CADENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.min} value={String(o.min)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sch-action">Action</Label>
                <Select value={draft.action} onValueChange={(v) => setDraft({ ...draft, action: v as ScheduleDraft['action'] })}>
                  <SelectTrigger id="sch-action" className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-stone-950 border-white/10">
                    <SelectItem value="backup">Create backup</SelectItem>
                    <SelectItem value="restart">Restart server</SelectItem>
                    <SelectItem value="command">Run command</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {draft.action === 'command' && (
              <div className="space-y-2">
                <Label htmlFor="sch-cmd">Command (without /)</Label>
                <Input
                  id="sch-cmd"
                  value={draft.payload}
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, payload: e.target.value })}
                  placeholder="say Event starting in 5 minutes!"
                  className="bg-white/[0.03] border-white/10 font-mono"
                />
              </div>
            )}
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <div>
                <p className="text-sm text-stone-300">Enabled</p>
                <p className="text-xs text-stone-600">Paused tasks are skipped by the watchdog</p>
              </div>
              <Switch checked={draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} aria-label="Enabled" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => (setCreateOpen(false), setEditTarget(null))} className="text-stone-400">Cancel</Button>
            <Button
              disabled={!draftValid || saveMutation.isPending}
              onClick={() => saveMutation.mutate(draft)}
              className="bg-orange-500 text-stone-950 hover:bg-orange-400 font-semibold"
            >
              {saveMutation.isPending ? 'Saving…' : editTarget ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-stone-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This scheduled task will stop running immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

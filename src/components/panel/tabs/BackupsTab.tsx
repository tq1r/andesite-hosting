'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { HardDriveDownload, Plus, RotateCcw, Trash2, Package, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import type { BackupDTO, ServerDTO } from '@/lib/mc'
import { useState } from 'react'

export function BackupsTab({ server }: { server: ServerDTO }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [restoreTarget, setRestoreTarget] = useState<BackupDTO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BackupDTO | null>(null)

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups', server.id],
    queryFn: () => api<{ backups: BackupDTO[] }>(`/api/servers/${server.id}/backups`).then((r) => r.backups),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['backups', server.id] })
    queryClient.invalidateQueries({ queryKey: ['activity'] })
  }

  const createMutation = useMutation({
    mutationFn: () => api<{ backup: BackupDTO }>(`/api/servers/${server.id}/backups`, { method: 'POST', body: '{}' }),
    onSuccess: (r) => {
      invalidate()
      toast({ title: 'Backup created', description: `${r.backup.name} (${r.backup.sizeMb} MB)` })
    },
    onError: (e) => toast({ title: 'Backup failed', description: e.message, variant: 'destructive' }),
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api(`/api/backups/${id}`, { method: 'POST' }),
    onSuccess: () => {
      invalidate()
      setRestoreTarget(null)
      toast({ title: 'World restored', description: 'The backup was rolled back successfully.' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/backups/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
      toast({ title: 'Backup deleted' })
    },
  })

  const downloadBackup = (b: BackupDTO) => {
    // demo panels keep snapshots server-side; the button exports a manifest
    const manifest = {
      backup: b.name,
      server: server.name,
      created: b.createdAt,
      sizeMb: b.sizeMb,
      contents: ['world/level.dat', 'world/region/*.mca', 'world/playerdata/*.dat', 'plugins/*', 'server.properties'],
      note: 'Full .zip archives download over SFTP — see Settings → SFTP access.',
    }
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${b.name.replace(/[^a-z0-9_-]+/gi, '_')}_manifest.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast({ title: 'Manifest downloaded', description: 'Full archives are served over SFTP.' })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="bg-white/[0.02] border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <HardDriveDownload className="h-4 w-4 text-emerald-400" /> World backups
            <span className="font-mono text-xs text-zinc-500">({backups.length})</span>
          </div>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
          >
            <Plus className="mr-1 h-4 w-4" /> {createMutation.isPending ? 'Backing up…' : 'Create backup'}
          </Button>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="py-14 flex flex-col items-center text-center gap-2">
              <Package className="h-9 w-9 text-zinc-700" />
              <p className="text-sm text-zinc-500">No backups yet.</p>
              <p className="text-xs text-zinc-600 max-w-xs">
                Snapshots capture the entire world folder. Create one before big updates — griefing insurance, one click.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {backups.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <HardDriveDownload className="h-4 w-4 text-emerald-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[13px] text-zinc-200 truncate">{b.name}</p>
                    <p className="text-[11px] text-zinc-600">
                      {format(new Date(b.createdAt), 'MMM d, yyyy HH:mm')} · {b.sizeMb} MB
                    </p>
                  </div>
                  <Button
                    size="sm" variant="ghost" onClick={() => downloadBackup(b)}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-emerald-300 hover:bg-emerald-500/10"
                    aria-label={`Download ${b.name}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRestoreTarget(b)} className="border-white/10 hover:bg-white/5 h-8">
                    <RotateCcw className="mr-1 h-3.5 w-3.5 text-amber-300" /> Restore
                  </Button>
                  <Button
                    size="sm" variant="ghost" onClick={() => setDeleteTarget(b)}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    aria-label={`Delete ${b.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore “{restoreTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The current world will be replaced with this snapshot. Anything built after this backup will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreTarget && restoreMutation.mutate(restoreTarget.id)}
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              Restore world
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This snapshot will be permanently removed.</AlertDialogDescription>
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

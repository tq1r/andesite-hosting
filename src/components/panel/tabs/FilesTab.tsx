'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Folder, FileText, FileJson, FileCog, Package, FileArchive, Database,
  ChevronRight, FolderPlus, FilePlus, Trash2, Save, Home, Binary,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { sizeLabel, type FileNodeDTO, type ServerDTO } from '@/lib/mc'

const TEXT_EXTS = ['.properties', '.txt', '.json', '.yml', '.log', '.mcmeta', '.cfg', '.json.gz.txt']

function fileIcon(name: string, isDir: boolean) {
  if (isDir) return Folder
  const lower = name.toLowerCase()
  if (lower.endsWith('.json')) return FileJson
  if (lower.endsWith('.jar')) return Package
  if (lower.endsWith('.log') || lower.endsWith('.gz')) return FileArchive
  if (lower.endsWith('.dat') || lower.endsWith('.lock') || lower.endsWith('.mca')) return Database
  if (lower.endsWith('.properties')) return FileCog
  return FileText
}

function isTextFile(name: string): boolean {
  const lower = name.toLowerCase()
  return TEXT_EXTS.some((e) => lower.endsWith(e)) && !lower.endsWith('.gz')
}

export function FilesTab({ server }: { server: ServerDTO }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentDirId, setCurrentDirId] = useState<string | null>(null)
  const [openFile, setOpenFile] = useState<FileNodeDTO | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FileNodeDTO | null>(null)
  const [createDialog, setCreateDialog] = useState<'file' | 'folder' | null>(null)
  const [createName, setCreateName] = useState('')

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', server.id],
    queryFn: () => api<{ files: FileNodeDTO[] }>(`/api/servers/${server.id}/files`).then((r) => r.files),
  })

  const byId = useMemo(() => new Map(files.map((f) => [f.id, f])), [files])

  const currentDir = currentDirId ? byId.get(currentDirId) : null
  const breadcrumbs = useMemo(() => {
    const crumbs: FileNodeDTO[] = []
    let node = currentDir
    while (node) {
      crumbs.unshift(node)
      node = node.parentId ? byId.get(node.parentId) ?? null : null
    }
    return crumbs
  }, [currentDir, byId])

  const items = useMemo(
    () => files.filter((f) => (f.parentId ?? null) === (currentDirId ?? null)),
    [files, currentDirId]
  )

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['files', server.id] })
  }

  const saveMutation = useMutation({
    mutationFn: (f: FileNodeDTO) =>
      api(`/api/files/${f.id}`, { method: 'PATCH', body: JSON.stringify({ content: editContent }) }),
    onSuccess: () => {
      refetch()
      toast({ title: 'File saved', description: openFile?.name })
    },
    onError: (e) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  })

  const createMutation = useMutation({
    mutationFn: ({ name, isDir }: { name: string; isDir: boolean }) =>
      api(`/api/servers/${server.id}/files`, {
        method: 'POST',
        body: JSON.stringify({ parentId: currentDirId, name, isDir, content: isDir ? undefined : '' }),
      }),
    onSuccess: (_d, vars) => {
      refetch()
      setCreateDialog(null)
      setCreateName('')
      toast({ title: vars.isDir ? 'Folder created' : 'File created', description: vars.name })
    },
    onError: (e) => toast({ title: 'Create failed', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/files/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refetch()
      setDeleteTarget(null)
      toast({ title: 'Deleted', description: 'The item and its contents were removed.' })
    },
  })

  const openEditor = (f: FileNodeDTO) => {
    setOpenFile(f)
    setEditContent(f.content ?? '')
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/[0.02] border-white/5">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-1 text-sm text-zinc-400 min-w-0 overflow-x-auto">
            <button
              onClick={() => setCurrentDirId(null)}
              className="flex items-center gap-1 hover:text-emerald-300 transition-colors shrink-0"
            >
              <Home className="h-3.5 w-3.5" /> root
            </button>
            {breadcrumbs.map((b) => (
              <span key={b.id} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                <button onClick={() => setCurrentDirId(b.id)} className="hover:text-emerald-300 transition-colors font-mono text-[13px]">
                  {b.name}
                </button>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setCreateDialog('folder')} className="border-white/10 hover:bg-white/5 h-8">
              <FolderPlus className="mr-1 h-3.5 w-3.5 text-emerald-400" /> <span className="hidden sm:inline">Folder</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreateDialog('file')} className="border-white/10 hover:bg-white/5 h-8">
              <FilePlus className="mr-1 h-3.5 w-3.5 text-emerald-400" /> <span className="hidden sm:inline">File</span>
            </Button>
          </div>
        </div>

        {/* listing */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-zinc-600 text-center">This folder is empty.</p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {items.map((f) => {
                const Icon = fileIcon(f.name, f.isDir)
                return (
                  <li
                    key={f.id}
                    className="group flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${f.isDir ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <button
                      onClick={() => (f.isDir ? setCurrentDirId(f.id) : openEditor(f))}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="font-mono text-[13px] text-zinc-200 group-hover:text-emerald-300 transition-colors truncate block">
                        {f.name}
                      </span>
                    </button>
                    <span className="hidden sm:block text-xs font-mono text-zinc-600 w-20 text-right shrink-0">
                      {f.isDir ? '—' : sizeLabel(f.size)}
                    </span>
                    <span className="hidden lg:block text-[11px] text-zinc-600 w-28 text-right shrink-0">
                      {new Date(f.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(f)}
                      className="rounded-md p-1.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-400 transition-all focus:opacity-100"
                      aria-label={`Delete ${f.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* file editor dialog */}
      <Dialog open={!!openFile} onOpenChange={(o) => !o && setOpenFile(null)}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm text-emerald-400 flex items-center gap-2">
              {openFile?.name}
              {openFile && <span className="text-zinc-600 font-sans text-xs">{sizeLabel(openFile.size)}</span>}
            </DialogTitle>
            <DialogDescription className="sr-only">Edit file contents</DialogDescription>
          </DialogHeader>
          {openFile && (isTextFile(openFile.name) ? (
            <>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                spellCheck={false}
                className="h-80 w-full resize-none rounded-md border border-white/10 bg-black/50 p-3 font-mono text-[12.5px] leading-relaxed text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                aria-label={`Edit ${openFile.name}`}
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenFile(null)} className="text-zinc-400">Close</Button>
                <Button onClick={() => saveMutation.mutate(openFile)} disabled={saveMutation.isPending} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold">
                  <Save className="mr-1.5 h-4 w-4" /> {saveMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3 rounded-md border border-white/10 bg-black/40 py-10">
                <Binary className="h-10 w-10 text-zinc-600" />
                <p className="text-sm text-zinc-400">Binary file — {sizeLabel(openFile.size)}</p>
                <p className="text-xs text-zinc-600 font-mono">Preview not available for this file type</p>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenFile(null)} className="text-zinc-400">Close</Button>
              </DialogFooter>
            </>
          ))}
        </DialogContent>
      </Dialog>

      {/* create dialog */}
      <Dialog open={!!createDialog} onOpenChange={(o) => !o && setCreateDialog(null)}>
        <DialogContent className="max-w-sm bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-sm">
              New {createDialog === 'folder' ? 'folder' : 'file'} {currentDir ? `in /${currentDir.name}` : 'in root'}
            </DialogTitle>
            <DialogDescription className="sr-only">Name the new item</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-item-name">Name</Label>
            <Input
              id="new-item-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={createDialog === 'folder' ? 'my-plugins-config' : 'config.yml'}
              className="bg-white/[0.03] border-white/10 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && createName.trim()) {
                  createMutation.mutate({ name: createName.trim(), isDir: createDialog === 'folder' })
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialog(null)} className="text-zinc-400">Cancel</Button>
            <Button
              disabled={!createName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate({ name: createName.trim(), isDir: createDialog === 'folder' })}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.isDir
                ? 'This folder and everything inside it will be permanently removed.'
                : 'This file will be permanently removed.'}
            </AlertDialogDescription>
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

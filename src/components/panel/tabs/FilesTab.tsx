'use client'

import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Folder, FileText, FileJson, FileCog, Package, FileArchive, Database,
  ChevronRight, FolderPlus, FilePlus, Trash2, Save, Home, Binary,
  Upload, Download, Pencil, FolderInput, Loader2,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
  const [renameTarget, setRenameTarget] = useState<FileNodeDTO | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [moveTarget, setMoveTarget] = useState<FileNodeDTO | null>(null)
  const [uploading, setUploading] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

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

  const folderOptions = useMemo(() => {
    if (!moveTarget) return []
    // exclude the moved folder itself + its descendants
    const blocked = new Set<string>([moveTarget.id])
    let frontier = [moveTarget.id]
    while (frontier.length) {
      const kids = files.filter((f) => f.parentId && frontier.includes(f.parentId)).map((f) => f.id)
      kids.forEach((k) => blocked.add(k))
      frontier = kids
    }
    const pathOf = (f: FileNodeDTO): string => {
      const parts: string[] = []
      let node: FileNodeDTO | undefined = f
      while (node) {
        parts.unshift(node.name)
        node = node.parentId ? byId.get(node.parentId) : undefined
      }
      return '/' + parts.join('/')
    }
    return files
      .filter((f) => f.isDir && !blocked.has(f.id))
      .map((d) => ({ id: d.id, label: pathOf(d) }))
  }, [files, byId, moveTarget])

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

  const renameMutation = useMutation({
    mutationFn: (f: FileNodeDTO) =>
      api(`/api/files/${f.id}`, { method: 'PATCH', body: JSON.stringify({ name: renameValue.trim() }) }),
    onSuccess: (_d, f) => {
      refetch()
      setRenameTarget(null)
      toast({ title: 'Renamed', description: `${f.name} → ${renameValue.trim()}` })
    },
    onError: (e) => toast({ title: 'Rename failed', description: e.message, variant: 'destructive' }),
  })

  const moveMutation = useMutation({
    mutationFn: ({ f, parentId }: { f: FileNodeDTO; parentId: string | null }) =>
      api(`/api/files/${f.id}`, { method: 'PATCH', body: JSON.stringify({ parentId }) }),
    onSuccess: () => {
      refetch()
      setMoveTarget(null)
      toast({ title: 'Moved', description: 'The item now lives in its new folder.' })
    },
    onError: (e) => toast({ title: 'Move failed', description: e.message, variant: 'destructive' }),
  })

  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return
    setUploading(true)
    let ok = 0
    let fail = 0
    for (const f of Array.from(list)) {
      try {
        const lower = f.name.toLowerCase()
        const textLike = (f.type.startsWith('text/') || TEXT_EXTS.some((e) => lower.endsWith(e))) && f.size < 200_000
        const body: Record<string, unknown> = { parentId: currentDirId, name: f.name, isDir: false }
        if (textLike) body.content = await f.text()
        else body.size = f.size
        await api(`/api/servers/${server.id}/files`, { method: 'POST', body: JSON.stringify(body) })
        ok++
      } catch {
        fail++
      }
    }
    setUploading(false)
    if (uploadRef.current) uploadRef.current.value = ''
    refetch()
    toast({
      title: `Uploaded ${ok} file${ok !== 1 ? 's' : ''}`,
      description: fail ? `${fail} failed — name clash or too large.` : undefined,
      variant: fail && !ok ? 'destructive' : undefined,
    })
  }

  const download = (f: FileNodeDTO) => {
    if (f.isDir) {
      toast({ title: 'Folder download', description: 'World folders are served over SFTP — see Settings → SFTP access.' })
      return
    }
    if (f.content == null) {
      toast({ title: 'Binary file', description: `${f.name} (${sizeLabel(f.size)}) is served over SFTP — see Settings.` })
      return
    }
    const blob = new Blob([f.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const items = useMemo(
    () => files.filter((f) => (f.parentId ?? null) === (currentDirId ?? null)),
    [files, currentDirId]
  )

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
            <input
              ref={uploadRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onUpload(e.target.files)}
              aria-hidden
              tabIndex={-1}
            />
            <Button
              size="sm" variant="outline"
              onClick={() => uploadRef.current?.click()}
              disabled={uploading}
              className="border-white/10 hover:bg-white/5 h-8"
            >
              {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-emerald-400" /> : <Upload className="mr-1 h-3.5 w-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{uploading ? 'Uploading…' : 'Upload'}</span>
            </Button>
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
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => download(f)}
                        className="rounded-md p-1.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-zinc-200 transition-all focus:opacity-100"
                        aria-label={`Download ${f.name}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => (setRenameTarget(f), setRenameValue(f.name))}
                        className="rounded-md p-1.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-zinc-200 transition-all focus:opacity-100"
                        aria-label={`Rename ${f.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setMoveTarget(f)}
                        className="rounded-md p-1.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-zinc-200 transition-all focus:opacity-100"
                        aria-label={`Move ${f.name}`}
                      >
                        <FolderInput className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(f)}
                        className="rounded-md p-1.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-400 transition-all focus:opacity-100"
                        aria-label={`Delete ${f.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

      {/* rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="max-w-sm bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-sm">Rename “{renameTarget?.name}”</DialogTitle>
            <DialogDescription className="sr-only">Enter a new name</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-value">New name</Label>
            <Input
              id="rename-value"
              value={renameValue}
              maxLength={64}
              onChange={(e) => setRenameValue(e.target.value)}
              className="bg-white/[0.03] border-white/10 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim() && renameTarget) renameMutation.mutate(renameTarget)
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameTarget(null)} className="text-zinc-400">Cancel</Button>
            <Button
              disabled={!renameValue.trim() || renameMutation.isPending}
              onClick={() => renameTarget && renameMutation.mutate(renameTarget)}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* move dialog */}
      <Dialog open={!!moveTarget} onOpenChange={(o) => !o && setMoveTarget(null)}>
        <DialogContent className="max-w-sm bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-sm">Move “{moveTarget?.name}”</DialogTitle>
            <DialogDescription>Pick a destination folder</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="move-dest">Destination</Label>
            <Select
              value=""
              onValueChange={(v) => moveTarget && moveMutation.mutate({ f: moveTarget, parentId: v === '__root__' ? null : v })}
            >
              <SelectTrigger id="move-dest" className="bg-white/[0.03] border-white/10 font-mono text-xs">
                <SelectValue placeholder="Choose a folder…" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 max-h-64">
                <SelectItem value="__root__" className="font-mono">/ (root)</SelectItem>
                {folderOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="font-mono">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-600">Moving is instant — the panel just updates the path.</p>
          </div>
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

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(64).refine((v) => !v.includes('/'), 'Invalid name').optional(),
  content: z.string().max(200_000).optional(),
  parentId: z.string().nullable().optional(), // move to another folder
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const file = await db.fileNode.findUnique({ where: { id } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { name, content, parentId } = parsed.data

  if (name && name !== file.name) {
    const exists = await db.fileNode.findFirst({
      where: { serverId: file.serverId, parentId: file.parentId ?? null, name },
    })
    if (exists) return NextResponse.json({ error: `"${name}" already exists here` }, { status: 409 })
  }

  // move (rename-in-path): validate target folder, prevent cycles
  let moveParentId = file.parentId
  if (parentId !== undefined) {
    if (parentId === null) {
      moveParentId = null
    } else {
      const target = await db.fileNode.findUnique({ where: { id: parentId } })
      if (!target || target.serverId !== file.serverId || !target.isDir) {
        return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
      }
      if (target.id === file.id) {
        return NextResponse.json({ error: 'Cannot move a folder into itself' }, { status: 400 })
      }
      // walk up from target — if we reach `file`, it's a descendant → cycle
      let node: { id: string; parentId: string | null } | null = target
      while (node) {
        if (node.id === file.id) return NextResponse.json({ error: 'Cannot move a folder into its own subtree' }, { status: 400 })
        node = node.parentId
          ? await db.fileNode.findUnique({ where: { id: node.parentId }, select: { id: true, parentId: true } })
          : null
      }
      const clash = await db.fileNode.findFirst({
        where: { serverId: file.serverId, parentId, name: name ?? file.name },
      })
      if (clash && clash.id !== file.id) {
        return NextResponse.json({ error: `"${name ?? file.name}" already exists in that folder` }, { status: 409 })
      }
      moveParentId = parentId
    }
  }

  const updated = await db.fileNode.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(content !== undefined && !file.isDir ? { content, size: content.length } : {}),
      ...(parentId !== undefined ? { parentId: moveParentId } : {}),
    },
  })
  return NextResponse.json({ file: updated })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const file = await db.fileNode.findUnique({ where: { id } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  // BFS: collect all descendants, then delete
  const ids: string[] = [id]
  let frontier = [id]
  while (frontier.length) {
    const children = await db.fileNode.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    })
    frontier = children.map((c) => c.id)
    ids.push(...frontier)
  }
  await db.fileNode.deleteMany({ where: { id: { in: ids } } })
  return NextResponse.json({ ok: true, deleted: ids.length })
}

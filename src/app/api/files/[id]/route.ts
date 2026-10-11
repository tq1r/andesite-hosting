import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(64).refine((v) => !v.includes('/'), 'Invalid name').optional(),
  content: z.string().max(200_000).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const file = await db.fileNode.findUnique({ where: { id } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const { name, content } = parsed.data

  if (name && name !== file.name) {
    const exists = await db.fileNode.findFirst({
      where: { serverId: file.serverId, parentId: file.parentId ?? null, name },
    })
    if (exists) return NextResponse.json({ error: `"${name}" already exists here` }, { status: 409 })
  }

  const updated = await db.fileNode.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(content !== undefined && !file.isDir ? { content, size: content.length } : {}),
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

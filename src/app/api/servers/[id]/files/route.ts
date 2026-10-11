import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  parentId: z.string().nullable(),
  name: z.string().trim().min(1).max(64).refine((v) => !v.includes('/'), 'Invalid name'),
  isDir: z.boolean(),
  content: z.string().max(200_000).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const files = await db.fileNode.findMany({
    where: { serverId: id },
    select: { id: true, parentId: true, name: true, isDir: true, size: true, content: true, updatedAt: true },
    orderBy: [{ isDir: 'desc' }, { name: 'asc' }],
  })
  return NextResponse.json({ files })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid file', details: parsed.error.flatten() }, { status: 400 })
  const { parentId, name, isDir, content } = parsed.data

  if (parentId) {
    const parent = await db.fileNode.findUnique({ where: { id: parentId } })
    if (!parent || parent.serverId !== id || !parent.isDir) {
      return NextResponse.json({ error: 'Invalid parent folder' }, { status: 400 })
    }
  }

  const exists = await db.fileNode.findFirst({ where: { serverId: id, parentId: parentId ?? null, name } })
  if (exists) return NextResponse.json({ error: `"${name}" already exists here` }, { status: 409 })

  const file = await db.fileNode.create({
    data: {
      serverId: id,
      parentId: parentId ?? null,
      name,
      isDir,
      content: isDir ? null : (content ?? ''),
      size: isDir ? 0 : (content?.length ?? 0),
    },
  })
  return NextResponse.json({ file }, { status: 201 })
}

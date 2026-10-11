import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { syncSchedules } from '@/lib/engine'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  everyMin: z.number().int().min(5).max(20160),
  action: z.enum(['backup', 'restart', 'command']),
  payload: z.string().trim().max(120).optional(),
  enabled: z.boolean().default(true),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })
  const schedules = await db.schedule.findMany({
    where: { serverId: id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ schedules })
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const server = await db.server.findUnique({ where: { id } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid schedule', details: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data

  if (data.action === 'command' && !data.payload) {
    return NextResponse.json({ error: 'Command schedules need a command to run' }, { status: 400 })
  }

  const schedule = await db.schedule.create({
    data: {
      serverId: id,
      name: data.name,
      everyMin: data.everyMin,
      action: data.action,
      payload: data.action === 'command' ? data.payload : null,
      enabled: data.enabled,
    },
  })

  await db.activity.create({
    data: {
      type: 'schedule',
      message: `Schedule "${data.name}" created for "${server.name}"`,
      serverId: id,
      serverName: server.name,
    },
  })
  await syncSchedules()
  return NextResponse.json({ schedule }, { status: 201 })
}

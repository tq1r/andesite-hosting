import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { syncSchedules } from '@/lib/engine'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  everyMin: z.number().int().min(5).max(20160).optional(),
  action: z.enum(['backup', 'restart', 'command']).optional(),
  payload: z.string().trim().max(120).nullable().optional(),
  enabled: z.boolean().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const schedule = await db.schedule.findUnique({ where: { id } })
  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid schedule', details: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data

  if ((data.action ?? schedule.action) === 'command' && !(data.payload ?? schedule.payload)) {
    return NextResponse.json({ error: 'Command schedules need a command to run' }, { status: 400 })
  }

  const updated = await db.schedule.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.everyMin ? { everyMin: data.everyMin } : {}),
      ...(data.action ? { action: data.action } : {}),
      ...(data.payload !== undefined ? { payload: data.payload || null } : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
    },
  })
  await syncSchedules()
  return NextResponse.json({ schedule: updated })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const schedule = await db.schedule.findUnique({ where: { id } })
  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

  await db.schedule.delete({ where: { id } })
  await db.activity.create({
    data: {
      type: 'schedule',
      message: `Schedule "${schedule.name}" removed`,
      serverId: schedule.serverId,
      serverName: (await db.server.findUnique({ where: { id: schedule.serverId }, select: { name: true } }))?.name ?? null,
    },
  })
  await syncSchedules()
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { syncSchedules } from '@/lib/engine'

export const dynamic = 'force-dynamic'

const ranSchema = z.object({
  at: z.number().int().min(0),
  result: z.string().max(200),
})

type Ctx = { params: Promise<{ id: string }> }

/** Report a schedule execution back from the engine watchdog */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const schedule = await db.schedule.findUnique({ where: { id } })
  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

  const parsed = ranSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid report' }, { status: 400 })

  const updated = await db.schedule.update({
    where: { id },
    data: { lastRunAt: new Date(parsed.data.at), lastResult: parsed.data.result },
  })
  await syncSchedules()
  return NextResponse.json({ schedule: updated })
}

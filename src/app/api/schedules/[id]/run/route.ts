import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { engineCommand, enginePower, syncSchedules } from '@/lib/engine'
import { createBackupFor } from '@/lib/seed'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** Run a schedule right now, from the panel button */
export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const schedule = await db.schedule.findUnique({ where: { id } })
  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
  const server = await db.server.findUnique({ where: { id: schedule.serverId } })
  if (!server) return NextResponse.json({ error: 'Server not found' }, { status: 404 })

  let result: string
  if (schedule.action === 'backup') {
    const backup = await createBackupFor(server, `manual-run_backup`)
    result = `backup created (${backup.sizeMb} MB)`
  } else if (schedule.action === 'restart') {
    await enginePower(server.id, 'restart')
    result = 'restart requested'
  } else {
    await engineCommand(server.id, schedule.payload ?? 'say Scheduled task')
    result = `ran "${schedule.payload}"`
  }

  const updated = await db.schedule.update({
    where: { id },
    data: { lastRunAt: new Date(), lastResult: result },
  })
  await syncSchedules()
  return NextResponse.json({ schedule: updated, result })
}

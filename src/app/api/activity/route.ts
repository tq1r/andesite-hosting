import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20) || 20, 50)
  const activity = await db.activity.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
  return NextResponse.json({ activity })
}

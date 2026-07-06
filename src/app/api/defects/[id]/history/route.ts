import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const defect = await db.defect.findUnique({ where: { id }, select: { id: true, defectId: true } })
    if (!defect) return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    const history = await db.defectHistory.findMany({
      where: { defectId: id },
      include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(history)
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
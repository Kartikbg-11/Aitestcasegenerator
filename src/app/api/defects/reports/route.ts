import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId

    const [total, defects, severityGroups, statusGroups] = await Promise.all([
      db.defect.count({ where }),
      db.defect.findMany({ where, select: { id: true, status: true, severity: true, priority: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: 'asc' } }),
      db.defect.groupBy({ by: ['severity'], where, _count: true }),
      db.defect.groupBy({ by: ['status'], where, _count: true }),
    ])

    const statusCounts: Record<string, number> = {}
    for (const g of statusGroups) statusCounts[g.status] = g._count
    const severityCounts: Record<string, number> = {}
    for (const g of severityGroups) severityCounts[g.severity] = g._count

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const trendMap: Record<string, { opened: number; closed: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      trendMap[day.toISOString().split('T')[0]] = { opened: 0, closed: 0 }
    }
    for (const d of defects) {
      const key = d.createdAt.toISOString().split('T')[0]
      if (trendMap[key]) trendMap[key].opened++
    }
    for (const d of defects) {
      if (d.status === 'CLOSED' && d.updatedAt >= thirtyDaysAgo) {
        const key = d.updatedAt.toISOString().split('T')[0]
        if (trendMap[key]) trendMap[key].closed++
      }
    }
    const trendData = Object.entries(trendMap).map(([date, counts]) => ({ date, opened: counts.opened, closed: counts.closed }))

    const priorityGroups = await db.defect.groupBy({ by: ['priority'], where, _count: true })
    const priorityCounts: Record<string, number> = {}
    for (const g of priorityGroups) priorityCounts[g.priority] = g._count

    return NextResponse.json({
      summary: {
        total,
        open: (statusCounts['NEW'] || 0) + (statusCounts['ASSIGNED'] || 0) + (statusCounts['IN_PROGRESS'] || 0) + (statusCounts['FIXED'] || 0) + (statusCounts['RETEST'] || 0),
        closed: statusCounts['CLOSED'] || 0,
        critical: severityCounts['CRITICAL'] || 0,
        reopened: statusCounts['REOPENED'] || 0,
        inProgress: (statusCounts['IN_PROGRESS'] || 0) + (statusCounts['FIXED'] || 0),
        retest: statusCounts['RETEST'] || 0,
      },
      severityDistribution: severityCounts,
      statusDistribution: statusCounts,
      priorityDistribution: priorityCounts,
      trendData,
      recentDefects: await db.defect.findMany({
        where, take: 5, orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true } }, reportedBy: { select: { firstName: true, lastName: true } }, assignedTo: { select: { firstName: true, lastName: true } } },
      }),
    })
  } catch (error) {
    console.error('Defect reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
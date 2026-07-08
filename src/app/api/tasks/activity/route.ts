import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/activity?userId=xxx&taskId=xxx&projectId=xxx&action=xxx&startDate=xxx&endDate=xxx&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const taskId = searchParams.get('taskId')
    const projectId = searchParams.get('projectId')
    const action = searchParams.get('action')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}

    if (userId) where.userId = userId
    if (taskId) where.taskId = taskId
    if (action) where.action = action

    // Date range filter
    if (startDateStr || endDateStr) {
      const dateFilter: Record<string, unknown> = {}
      if (startDateStr) dateFilter.gte = new Date(startDateStr)
      if (endDateStr) dateFilter.lte = new Date(endDateStr)
      where.createdAt = dateFilter
    }

    // If projectId is provided, we need to filter through the task relation
    let taskIds: string[] | undefined
    if (projectId) {
      const tasks = await db.dailyTask.findMany({
        where: { projectId },
        select: { id: true },
      })
      taskIds = tasks.map((t) => t.id)
      if (taskIds.length === 0) {
        return NextResponse.json({ activities: [], total: 0, pagination: { limit, offset, hasMore: false } })
      }
      where.taskId = { in: taskIds }
    }

    const [activities, total] = await Promise.all([
      db.taskHistory.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              role: true,
            },
          },
          task: {
            select: {
              id: true,
              taskId: true,
              title: true,
              status: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.taskHistory.count({ where }),
    ])

    // Group activities by date for better display
    const groupedByDate: Record<string, typeof activities> = {}
    for (const activity of activities) {
      const dateKey = activity.createdAt.toISOString().split('T')[0]
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = []
      }
      groupedByDate[dateKey].push(activity)
    }

    return NextResponse.json({
      activities,
      groupedByDate,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Get activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
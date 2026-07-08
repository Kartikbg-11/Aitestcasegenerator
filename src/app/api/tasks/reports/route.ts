import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/reports?type=daily|weekly|monthly|sprint|team&projectId=xxx&startDate=xxx&endDate=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    const projectId = searchParams.get('projectId')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const sprint = searchParams.get('sprint')

    const projectFilter = projectId ? { projectId } : {}

    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr)
      endDate = new Date(endDateStr)
      endDate.setDate(endDate.getDate() + 1)
    } else {
      switch (type) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'weekly':
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - startDate.getDay())
          endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + 7)
          break
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    }

    const dateFilter = { createdAt: { gte: startDate, lt: endDate } }
    const sprintFilter = sprint ? { sprint } : {}

    if (type === 'team') {
      return generateTeamReport(projectFilter, startDate, endDate)
    }

    if (type === 'sprint') {
      return generateSprintReport(projectFilter, sprint)
    }

    // Common report data
    const [
      totalCreated,
      totalCompleted,
      totalCancelled,
      totalOverdue,
      statusBreakdown,
      priorityBreakdown,
      categoryBreakdown,
      tasksInPeriod,
    ] = await Promise.all([
      db.dailyTask.count({
        where: { ...projectFilter, ...dateFilter },
      }),
      db.dailyTask.count({
        where: { ...projectFilter, status: 'COMPLETED', completionDate: { gte: startDate, lt: endDate } },
      }),
      db.dailyTask.count({
        where: { ...projectFilter, status: 'CANCELLED', ...dateFilter },
      }),
      db.dailyTask.count({
        where: {
          ...projectFilter,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: now },
        },
      }),
      db.dailyTask.groupBy({
        by: ['status'],
        where: { ...projectFilter, ...dateFilter },
        _count: { status: true },
      }),
      db.dailyTask.groupBy({
        by: ['priority'],
        where: { ...projectFilter, ...dateFilter, status: { not: 'CANCELLED' } },
        _count: { priority: true },
      }),
      db.dailyTask.groupBy({
        by: ['taskCategory'],
        where: { ...projectFilter, ...dateFilter, status: { not: 'CANCELLED' } },
        _count: { taskCategory: true },
      }),
      db.dailyTask.findMany({
        where: { ...projectFilter, ...dateFilter, ...sprintFilter },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Time tracking stats
    const timeStats = await db.dailyTask.aggregate({
      where: { ...projectFilter, ...dateFilter },
      _sum: { estimatedHours: true, actualHours: true },
    })

    // Daily breakdown for chart
    const dailyBreakdown: { date: string; created: number; completed: number }[] = []
    const current = new Date(startDate)
    while (current < endDate) {
      const dayStart = new Date(current)
      const dayEnd = new Date(current)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const dateStr = dayStart.toISOString().split('T')[0]

      const [created, completed] = await Promise.all([
        db.dailyTask.count({
          where: { ...projectFilter, createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        db.dailyTask.count({
          where: { ...projectFilter, status: 'COMPLETED', completionDate: { gte: dayStart, lt: dayEnd } },
        }),
      ])

      dailyBreakdown.push({ date: dateStr, created, completed })
      current.setDate(current.getDate() + 1)
    }

    const activeTasks = totalCreated - totalCancelled
    const completionRate = activeTasks > 0
      ? Math.round((totalCompleted / activeTasks) * 100)
      : 0

    return NextResponse.json({
      type,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalCreated,
        totalCompleted,
        totalCancelled,
        totalOverdue,
        activeTasks,
        completionRate,
        totalEstimatedHours: timeStats._sum.estimatedHours || 0,
        totalActualHours: timeStats._sum.actualHours || 0,
        efficiency: timeStats._sum.estimatedHours && timeStats._sum.estimatedHours > 0
          ? Math.round(((timeStats._sum.actualHours || 0) / timeStats._sum.estimatedHours) * 100)
          : 0,
      },
      breakdown: {
        status: statusBreakdown.map((s) => ({ status: s.status, count: s._count.status })),
        priority: priorityBreakdown.map((p) => ({ priority: p.priority, count: p._count.priority })),
        category: categoryBreakdown.map((c) => ({ category: c.taskCategory, count: c._count.taskCategory })),
      },
      dailyBreakdown,
      tasks: tasksInPeriod,
    })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateTeamReport(
  projectFilter: Record<string, unknown>,
  startDate: Date,
  endDate: Date,
) {
  const dateFilter = { createdAt: { gte: startDate, lt: endDate } }

  const teamMembers = await db.dailyTask.groupBy({
    by: ['assignedToId'],
    where: {
      ...projectFilter,
      assignedToId: { not: null },
      ...dateFilter,
    },
    _count: { id: true },
    _sum: { estimatedHours: true, actualHours: true },
  })

  const memberDetails = await Promise.all(
    teamMembers.map(async (member) => {
      const userId = member.assignedToId!

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, username: true, role: true },
      })
      if (!user) return null

      const [completed, inProgress, blocked, overdue] = await Promise.all([
        db.dailyTask.count({
          where: { ...projectFilter, assignedToId: userId, status: 'COMPLETED', completionDate: { gte: startDate, lt: endDate } },
        }),
        db.dailyTask.count({
          where: { ...projectFilter, assignedToId: userId, status: 'IN_PROGRESS' },
        }),
        db.dailyTask.count({
          where: { ...projectFilter, assignedToId: userId, status: 'BLOCKED' },
        }),
        db.dailyTask.count({
          where: {
            ...projectFilter, assignedToId: userId,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            dueDate: { lt: new Date() },
          },
        }),
      ])

      return {
        user,
        productivity: {
          tasksAssigned: member._count.id,
          tasksCompleted: completed,
          tasksInProgress: inProgress,
          tasksBlocked: blocked,
          tasksOverdue: overdue,
          completionRate: member._count.id > 0
            ? Math.round((completed / member._count.id) * 100)
            : 0,
          estimatedHours: member._sum.estimatedHours || 0,
          actualHours: member._sum.actualHours || 0,
        },
      }
    }),
  )

  return NextResponse.json({
    type: 'team',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    members: memberDetails.filter(Boolean),
    totalTeamProductivity: {
      totalTasksAssigned: teamMembers.reduce((sum, m) => sum + m._count.id, 0),
      totalEstimatedHours: teamMembers.reduce((sum, m) => sum + (m._sum.estimatedHours || 0), 0),
      totalActualHours: teamMembers.reduce((sum, m) => sum + (m._sum.actualHours || 0), 0),
    },
  })
}

async function generateSprintReport(
  projectFilter: Record<string, unknown>,
  sprint: string | null,
) {
  const sprintFilter = sprint ? { sprint } : {}

  const sprintTasks = await db.dailyTask.findMany({
    where: { ...projectFilter, ...sprintFilter },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusGroups = await db.dailyTask.groupBy({
    by: ['status'],
    where: { ...projectFilter, ...sprintFilter },
    _count: { status: true },
  })

  const totalStoryPoints = await db.dailyTask.aggregate({
    where: { ...projectFilter, ...sprintFilter, status: { not: 'CANCELLED' } },
    _sum: { storyPoints: true },
  })

  const completedStoryPoints = await db.dailyTask.aggregate({
    where: { ...projectFilter, ...sprintFilter, status: 'COMPLETED' },
    _sum: { storyPoints: true },
  })

  const timeStats = await db.dailyTask.aggregate({
    where: { ...projectFilter, ...sprintFilter },
    _sum: { estimatedHours: true, actualHours: true },
  })

  const totalTasks = sprintTasks.length
  const completedTasks = sprintTasks.filter((t) => t.status === 'COMPLETED').length
  const cancelledTasks = sprintTasks.filter((t) => t.status === 'CANCELLED').length

  return NextResponse.json({
    type: 'sprint',
    sprint: sprint || 'All Sprints',
    summary: {
      totalTasks,
      completedTasks,
      cancelledTasks,
      activeTasks: totalTasks - cancelledTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalStoryPoints: totalStoryPoints._sum.storyPoints || 0,
      completedStoryPoints: completedStoryPoints._sum.storyPoints || 0,
      storyPointVelocity: completedStoryPoints._sum.storyPoints || 0,
      totalEstimatedHours: timeStats._sum.estimatedHours || 0,
      totalActualHours: timeStats._sum.actualHours || 0,
    },
    statusBreakdown: statusGroups.map((s) => ({ status: s.status, count: s._count.status })),
    tasks: sprintTasks,
  })
}
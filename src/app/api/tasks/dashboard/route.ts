import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/dashboard?projectId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Build where clause based on optional projectId filter
    const projectFilter = projectId ? { projectId } : {}

    // --- Core counts ---
    const [
      todayTasks,
      completedToday,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      highPriorityTasks,
      totalEstimatedHoursResult,
      totalActualHoursResult,
    ] = await Promise.all([
      // Tasks with due date today OR created today
      db.dailyTask.count({
        where: {
          ...projectFilter,
          status: { not: 'CANCELLED' },
          OR: [
            { dueDate: { gte: todayStart, lt: todayEnd } },
            { startDate: { gte: todayStart, lt: todayEnd } },
          ],
        },
      }),
      // Completed today
      db.dailyTask.count({
        where: {
          ...projectFilter,
          status: 'COMPLETED',
          completionDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      // Pending (TO_DO + READY + WAITING states)
      db.dailyTask.count({
        where: {
          ...projectFilter,
          status: {
            in: [
              'TO_DO', 'READY', 'WAITING_FOR_BUILD',
              'WAITING_FOR_ENVIRONMENT', 'WAITING_FOR_DEPENDENCY',
            ],
          },
        },
      }),
      // In Progress
      db.dailyTask.count({
        where: { ...projectFilter, status: 'IN_PROGRESS' },
      }),
      // Blocked
      db.dailyTask.count({
        where: { ...projectFilter, status: 'BLOCKED' },
      }),
      // Overdue: not completed/cancelled and past due
      db.dailyTask.count({
        where: {
          ...projectFilter,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: todayStart },
        },
      }),
      // High priority
      db.dailyTask.count({
        where: {
          ...projectFilter,
          priority: 'HIGH',
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      // Total estimated hours
      db.dailyTask.aggregate({
        where: { ...projectFilter, status: { not: 'CANCELLED' } },
        _sum: { estimatedHours: true },
      }),
      // Total actual hours
      db.dailyTask.aggregate({
        where: { ...projectFilter, status: { not: 'CANCELLED' } },
        _sum: { actualHours: true },
      }),
    ])

    const totalTasks = pendingTasks + inProgressTasks + blockedTasks +
      todayTasks // approximate - we also need completed
    const totalAllTasks = await db.dailyTask.count({
      where: { ...projectFilter, status: { not: 'CANCELLED' } },
    })
    const totalCompleted = await db.dailyTask.count({
      where: { ...projectFilter, status: 'COMPLETED' },
    })

    const completionPercentage = totalAllTasks > 0
      ? Math.round((totalCompleted / totalAllTasks) * 100)
      : 0

    // --- Weekly data (last 7 days) ---
    const weeklyData: { date: string; label: string; created: number; completed: number; inProgress: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const dateStr = dayStart.toISOString().split('T')[0]
      const dayLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

      const [created, completed, inProgress] = await Promise.all([
        db.dailyTask.count({
          where: { ...projectFilter, createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        db.dailyTask.count({
          where: { ...projectFilter, status: 'COMPLETED', completionDate: { gte: dayStart, lt: dayEnd } },
        }),
        db.dailyTask.count({
          where: { ...projectFilter, status: 'IN_PROGRESS' },
        }),
      ])

      weeklyData.push({ date: dateStr, label: dayLabel, created, completed, inProgress })
    }

    // --- Monthly data (last 4 weeks) ---
    const monthlyData: { week: string; label: string; created: number; completed: number }[] = []
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (w * 7 + 6))
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (w * 7) + 1)
      const weekLabel = `Week ${4 - w}`

      const [created, completed] = await Promise.all([
        db.dailyTask.count({
          where: { ...projectFilter, createdAt: { gte: weekStart, lt: weekEnd } },
        }),
        db.dailyTask.count({
          where: { ...projectFilter, status: 'COMPLETED', completionDate: { gte: weekStart, lt: weekEnd } },
        }),
      ])

      monthlyData.push({ week: weekStart.toISOString().split('T')[0], label: weekLabel, created, completed })
    }

    // --- Status distribution ---
    const statusGroups = await db.dailyTask.groupBy({
      by: ['status'],
      where: { ...projectFilter },
      _count: { status: true },
    })
    const statusDistribution = statusGroups.map((g) => ({
      status: g.status,
      count: g._count.status,
    }))

    // --- Priority distribution ---
    const priorityGroups = await db.dailyTask.groupBy({
      by: ['priority'],
      where: { ...projectFilter, status: { not: 'CANCELLED' } },
      _count: { priority: true },
    })
    const priorityDistribution = priorityGroups.map((g) => ({
      priority: g.priority,
      count: g._count.priority,
    }))

    // --- Category distribution ---
    const categoryGroups = await db.dailyTask.groupBy({
      by: ['taskCategory'],
      where: { ...projectFilter, status: { not: 'CANCELLED' } },
      _count: { taskCategory: true },
    })
    const categoryDistribution = categoryGroups.map((g) => ({
      category: g.taskCategory,
      count: g._count.taskCategory,
    }))

    return NextResponse.json({
      summary: {
        todayTasks,
        completedToday,
        pendingTasks,
        inProgressTasks,
        blockedTasks,
        overdueTasks,
        highPriorityTasks,
        totalEstimatedHours: totalEstimatedHoursResult._sum.estimatedHours || 0,
        totalActualHours: totalActualHoursResult._sum.actualHours || 0,
        completionPercentage,
        totalTasks: totalAllTasks,
        totalCompleted,
      },
      weeklyData,
      monthlyData,
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
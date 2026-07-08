import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/team?projectId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Get all users who have tasks
    const taskAssignees = await db.dailyTask.groupBy({
      by: ['assignedToId'],
      where: {
        ...(projectId ? { projectId } : {}),
        assignedToId: { not: null },
        status: { not: 'CANCELLED' },
      },
      _count: {
        id: true,
      },
      _sum: {
        estimatedHours: true,
        actualHours: true,
      },
    })

    // Get per-status counts for each user
    const teamStats = await Promise.all(
      taskAssignees.map(async (assignee) => {
        const userId = assignee.assignedToId!

        const user = await db.user.findUnique({
          where: { id: userId },
          select: { id: true, firstName: true, lastName: true, username: true, role: true, avatar: true },
        })

        if (!user) return null

        const [
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          overdueTasks,
          highPriorityTasks,
          toDoTasks,
        ] = await Promise.all([
          db.dailyTask.count({
            where: { assignedToId: userId, status: { not: 'CANCELLED' }, ...(projectId ? { projectId } : {}) },
          }),
          db.dailyTask.count({
            where: { assignedToId: userId, status: 'COMPLETED', ...(projectId ? { projectId } : {}) },
          }),
          db.dailyTask.count({
            where: { assignedToId: userId, status: 'IN_PROGRESS', ...(projectId ? { projectId } : {}) },
          }),
          db.dailyTask.count({
            where: { assignedToId: userId, status: 'BLOCKED', ...(projectId ? { projectId } : {}) },
          }),
          db.dailyTask.count({
            where: {
              assignedToId: userId,
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
              dueDate: { lt: new Date() },
              ...(projectId ? { projectId } : {}),
            },
          }),
          db.dailyTask.count({
            where: {
              assignedToId: userId,
              priority: 'HIGH',
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
              ...(projectId ? { projectId } : {}),
            },
          }),
          db.dailyTask.count({
            where: { assignedToId: userId, status: 'TO_DO', ...(projectId ? { projectId } : {}) },
          }),
        ])

        // Get task category breakdown
        const categoryBreakdown = await db.dailyTask.groupBy({
          by: ['taskCategory'],
          where: {
            assignedToId: userId,
            status: { not: 'CANCELLED' },
            ...(projectId ? { projectId } : {}),
          },
          _count: { taskCategory: true },
        })

        // Calculate utilization: (actualHours / estimatedHours) * 100, capped at 100 for active tasks
        const totalEstimated = assignee._sum.estimatedHours || 0
        const totalActual = assignee._sum.actualHours || 0
        const utilization = totalEstimated > 0
          ? Math.min(Math.round((totalActual / totalEstimated) * 100), 100)
          : 0

        // Completion percentage
        const completionPercentage = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0

        return {
          user,
          stats: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            blockedTasks,
            overdueTasks,
            highPriorityTasks,
            toDoTasks,
            completionPercentage,
            utilization,
            totalEstimatedHours: totalEstimated,
            totalActualHours: totalActual,
          },
          categoryBreakdown: categoryBreakdown.map((c) => ({
            category: c.taskCategory,
            count: c._count.taskCategory,
          })),
        }
      }),
    )

    // Filter out nulls
    const validStats = teamStats.filter((s) => s !== null)

    // Team totals
    const teamTotals = {
      totalMembers: validStats.length,
      totalTasks: validStats.reduce((sum, m) => sum + m.stats.totalTasks, 0),
      totalCompleted: validStats.reduce((sum, m) => sum + m.stats.completedTasks, 0),
      totalInProgress: validStats.reduce((sum, m) => sum + m.stats.inProgressTasks, 0),
      totalBlocked: validStats.reduce((sum, m) => sum + m.stats.blockedTasks, 0),
      totalOverdue: validStats.reduce((sum, m) => sum + m.stats.overdueTasks, 0),
      teamCompletionPercentage: validStats.length > 0
        ? Math.round(
            validStats.reduce((sum, m) => sum + m.stats.completionPercentage, 0) / validStats.length,
          )
        : 0,
    }

    return NextResponse.json({
      members: validStats,
      teamTotals,
    })
  } catch (error) {
    console.error('Team stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
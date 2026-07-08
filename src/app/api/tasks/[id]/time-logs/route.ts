import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/[id]/time-logs
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await db.dailyTask.findUnique({ where: { id }, select: { id: true } })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const timeLogs = await db.taskTimeLog.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
      orderBy: { startTime: 'desc' },
    })

    const totalDuration = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0)

    return NextResponse.json({
      timeLogs,
      summary: {
        totalDuration,
        totalEntries: timeLogs.length,
        completedEntries: timeLogs.filter((l) => l.endTime !== null).length,
        activeEntries: timeLogs.filter((l) => l.endTime === null).length,
      },
    })
  } catch (error) {
    console.error('Get time logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/time-logs - Start timer
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, description } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const task = await db.dailyTask.findUnique({ where: { id } })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if there's already an active timer for this user on this task
    const activeTimer = await db.taskTimeLog.findFirst({
      where: { taskId: id, userId, endTime: null },
    })

    if (activeTimer) {
      return NextResponse.json(
        { error: 'You already have an active timer on this task. Stop it before starting a new one.' },
        { status: 400 },
      )
    }

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]

    const timeLog = await db.taskTimeLog.create({
      data: {
        taskId: id,
        userId,
        startTime: now,
        duration: 0,
        description: description || '',
        date: dateStr,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    })

    // Create history entry
    await db.taskHistory.create({
      data: {
        taskId: id,
        userId,
        action: 'TIMER_STARTED',
        details: `Timer started for task ${task.taskId}`,
      },
    })

    return NextResponse.json(timeLog, { status: 201 })
  } catch (error) {
    console.error('Start timer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/tasks/[id]/time-logs - Stop timer
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { timeLogId, userId } = body

    if (!timeLogId || !userId) {
      return NextResponse.json({ error: 'timeLogId and userId are required' }, { status: 400 })
    }

    const task = await db.dailyTask.findUnique({ where: { id } })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const timeLog = await db.taskTimeLog.findUnique({
      where: { id: timeLogId },
    })

    if (!timeLog || timeLog.taskId !== id) {
      return NextResponse.json({ error: 'Time log not found for this task' }, { status: 404 })
    }

    if (timeLog.endTime !== null) {
      return NextResponse.json({ error: 'This timer has already been stopped' }, { status: 400 })
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - timeLog.startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    const updatedTimeLog = await db.taskTimeLog.update({
      where: { id: timeLogId },
      data: {
        endTime,
        duration: Math.round(durationHours * 100) / 100,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    })

    // Update task actualHours
    const allLogs = await db.taskTimeLog.findMany({
      where: { taskId: id, endTime: { not: null } },
      select: { duration: true },
    })
    const totalActualHours = allLogs.reduce((sum, log) => sum + log.duration, 0)

    await db.dailyTask.update({
      where: { id },
      data: { actualHours: Math.round(totalActualHours * 100) / 100 },
    })

    // Create history entry
    await db.taskHistory.create({
      data: {
        taskId: id,
        userId,
        action: 'TIMER_STOPPED',
        details: `Timer stopped for task ${task.taskId}. Duration: ${durationHours.toFixed(2)}h`,
      },
    })

    return NextResponse.json(updatedTimeLog)
  } catch (error) {
    console.error('Stop timer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks?projectId=xxx&assignedToId=xxx&status=xxx&priority=xxx&taskCategory=xxx&sprint=xxx&search=xxx&startDate=xxx&dueDate=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const assignedToId = searchParams.get('assignedToId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const taskCategory = searchParams.get('taskCategory')
    const sprint = searchParams.get('sprint')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const dueDate = searchParams.get('dueDate')

    const where: Record<string, unknown> = {}

    if (projectId) where.projectId = projectId
    if (assignedToId) where.assignedToId = assignedToId
    if (status && status !== 'ALL') where.status = status
    if (priority && priority !== 'ALL') where.priority = priority
    if (taskCategory && taskCategory !== 'ALL') where.taskCategory = taskCategory
    if (sprint && sprint !== 'ALL') where.sprint = sprint

    if (startDate || dueDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (dueDate) dateFilter.lte = new Date(dueDate)
      where.dueDate = dateFilter
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { taskId: { contains: search } },
        { description: { contains: search } },
        { module: { contains: search } },
        { feature: { contains: search } },
        { epic: { contains: search } },
        { userStory: { contains: search } },
      ]
    }

    const [tasks, totalTasks, completedTasks, inProgressTasks, blockedTasks, overdueTasks] =
      await Promise.all([
        db.dailyTask.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
            assignedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true, username: true, avatar: true } },
            labels: { select: { id: true, name: true, color: true } },
            _count: { select: { comments: true, attachments: true, timeLogs: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        db.dailyTask.count({ where }),
        db.dailyTask.count({ where: { ...where, status: 'COMPLETED' } }),
        db.dailyTask.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        db.dailyTask.count({ where: { ...where, status: 'BLOCKED' } }),
        db.dailyTask.count({
          where: {
            ...where,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            dueDate: { lt: new Date() },
          },
        }),
      ])

    return NextResponse.json({
      tasks,
      counts: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        overdueTasks,
      },
    })
  } catch (error) {
    console.error('List tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      projectId,
      sprint,
      epic,
      userStory,
      module,
      feature,
      taskCategory,
      taskType,
      priority,
      severity,
      assignedById,
      assignedToId,
      estimatedHours,
      storyPoints,
      startDate,
      dueDate,
      environment,
      dependencies,
      labels,
    } = body

    if (!title || !assignedById) {
      return NextResponse.json({ error: 'Title and assignedById are required' }, { status: 400 })
    }

    // Auto-generate taskId like TASK-0001 (incrementing)
    const lastTask = await db.dailyTask.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { taskId: true },
    })

    let nextNum = 1
    if (lastTask && lastTask.taskId) {
      const match = lastTask.taskId.match(/TASK-(\d+)/)
      if (match) {
        nextNum = parseInt(match[1], 10) + 1
      }
    }
    const taskId = `TASK-${String(nextNum).padStart(4, '0')}`

    const task = await db.dailyTask.create({
      data: {
        taskId,
        title,
        description: description || '',
        projectId: projectId || null,
        sprint: sprint || '',
        epic: epic || '',
        userStory: userStory || '',
        module: module || '',
        feature: feature || '',
        taskCategory: taskCategory || 'MANUAL_TESTING',
        taskType: taskType || 'FUNCTIONAL',
        priority: priority || 'MEDIUM',
        severity: severity || 'MODERATE',
        status: 'TO_DO',
        assignedById: assignedById || null,
        assignedToId: assignedToId || null,
        estimatedHours: estimatedHours || 0,
        storyPoints: storyPoints || 0,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        environment: environment || '',
        dependencies: dependencies || '',
        labels: labels
          ? {
              create: labels.map((l: { name: string; color?: string }) => ({
                name: l.name,
                color: l.color || '#10b981',
              })),
            }
          : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    })

    // Create TaskHistory entry for creation
    await db.taskHistory.create({
      data: {
        taskId: task.id,
        userId: assignedById,
        action: 'CREATED',
        details: `Task ${taskId} created: ${title}`,
      },
    })

    // Create TaskNotification for the assigned user
    if (assignedToId) {
      await db.taskNotification.create({
        data: {
          userId: assignedToId,
          taskId: task.id,
          title: 'New Task Assigned',
          message: `You have been assigned task ${taskId}: ${title}`,
          type: 'ASSIGNMENT',
        },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: assignedById,
        action: 'CREATE_TASK',
        entityType: 'DailyTask',
        entityId: task.id,
        details: `Created task ${taskId}: ${title}`,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
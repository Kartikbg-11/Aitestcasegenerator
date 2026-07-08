import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/[id]/comments
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await db.dailyTask.findUnique({ where: { id }, select: { id: true } })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const comments = await db.taskComment.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, username: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      where: { parentId: null },
      orderBy: { createdAt: 'asc' },
    })

    // Also get all reply-level comments for completeness
    const allReplies = await db.taskComment.findMany({
      where: { taskId: id, parentId: { not: null } },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ comments, allReplies })
  } catch (error) {
    console.error('List task comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/comments
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, comment, parentId } = body

    if (!userId || !comment || !comment.trim()) {
      return NextResponse.json({ error: 'userId and comment are required' }, { status: 400 })
    }

    const task = await db.dailyTask.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true } },
        assignedBy: { select: { id: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // If parentId is provided, validate it exists
    if (parentId) {
      const parentComment = await db.taskComment.findUnique({
        where: { id: parentId },
      })
      if (!parentComment || parentComment.taskId !== id) {
        return NextResponse.json({ error: 'Parent comment not found for this task' }, { status: 404 })
      }
    }

    const taskComment = await db.taskComment.create({
      data: {
        taskId: id,
        userId,
        comment: comment.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, username: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Create TaskHistory entry
    await db.taskHistory.create({
      data: {
        taskId: id,
        userId,
        action: parentId ? 'REPLY_ADDED' : 'COMMENT_ADDED',
        details: `${parentId ? 'Reply' : 'Comment'}: ${comment.trim().substring(0, 100)}`,
      },
    })

    // Create TaskNotification - notify task assignee and assigner (but not the commenter themselves)
    const notifyUserIds = new Set<string>()
    if (task.assignedToId && task.assignedToId !== userId) notifyUserIds.add(task.assignedToId)
    if (task.assignedById && task.assignedById !== userId) notifyUserIds.add(task.assignedById)

    // If it's a reply, also notify the parent comment author
    if (parentId) {
      const parentComment = await db.taskComment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      })
      if (parentComment && parentComment.userId !== userId) {
        notifyUserIds.add(parentComment.userId)
      }
    }

    for (const notifyUserId of notifyUserIds) {
      await db.taskNotification.create({
        data: {
          userId: notifyUserId,
          taskId: id,
          title: parentId ? 'New Reply on Task' : 'New Comment on Task',
          message: `${parentId ? 'Reply' : 'Comment'} on task ${task.taskId}: ${comment.trim().substring(0, 80)}`,
          type: 'COMMENT',
        },
      })
    }

    return NextResponse.json(taskComment, { status: 201 })
  } catch (error) {
    console.error('Create task comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await db.dailyTask.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } },
        labels: { select: { id: true, name: true, color: true } },
        comments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, username: true } },
            replies: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, username: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        history: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        timeLogs: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, username: true } },
          },
          orderBy: { startTime: 'desc' },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/tasks/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, labels: labelUpdates, ...updateFields } = body

    const existing = await db.dailyTask.findUnique({
      where: { id },
      include: { labels: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const actingUserId = userId || existing.assignedById || ''

    // Track changed fields in TaskHistory
    const trackedFields = [
      'title', 'description', 'status', 'priority', 'severity',
      'taskCategory', 'taskType', 'assignedToId', 'assignedById',
      'estimatedHours', 'storyPoints', 'startDate', 'dueDate',
      'sprint', 'epic', 'userStory', 'module', 'feature',
      'environment', 'dependencies', 'projectId',
    ] as const

    for (const field of trackedFields) {
      if (updateFields[field] !== undefined && updateFields[field] !== (existing[field as keyof typeof existing] ?? null)) {
        const oldValue = String(existing[field as keyof typeof existing] ?? '')
        const newValue = String(updateFields[field] ?? '')

        // Set completionDate when status changes to COMPLETED
        if (field === 'status' && updateFields[field] === 'COMPLETED') {
          updateFields.completionDate = new Date()
        } else if (field === 'status' && updateFields[field] !== 'COMPLETED') {
          updateFields.completionDate = null
        }

        await db.taskHistory.create({
          data: {
            taskId: id,
            userId: actingUserId,
            action: field === 'status' ? 'STATUS_CHANGE' : 'FIELD_UPDATE',
            field,
            oldValue,
            newValue,
            details: `${field}: "${oldValue}" -> "${newValue}"`,
          },
        })
      }
    }

    // Handle labels update
    if (labelUpdates !== undefined) {
      // Delete existing labels
      await db.taskLabel.deleteMany({ where: { taskId: id } })
      // Create new labels
      if (labelUpdates.length > 0) {
        await db.taskLabel.createMany({
          data: labelUpdates.map((l: { name: string; color?: string }) => ({
            taskId: id,
            name: l.name,
            color: l.color || '#10b981',
          })),
        })
      }
    }

    // Remove fields that should not be updated
    delete updateFields.id
    delete updateFields.taskId
    delete updateFields.createdAt
    delete updateFields.updatedAt
    delete updateFields.userId
    delete updateFields.labels

    const task = await db.dailyTask.update({
      where: { id },
      data: updateFields,
      include: {
        project: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    })

    // Create notification if assignedTo changed
    if (updateFields.assignedToId && updateFields.assignedToId !== existing.assignedToId) {
      await db.taskNotification.create({
        data: {
          userId: updateFields.assignedToId,
          taskId: id,
          title: 'Task Assigned to You',
          message: `You have been assigned task ${existing.taskId}: ${existing.title}`,
          type: 'ASSIGNMENT',
        },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: actingUserId,
        action: 'UPDATE_TASK',
        entityType: 'DailyTask',
        entityId: id,
        details: `Updated task ${existing.taskId}`,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - soft delete via status="CANCELLED"
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'
    const userId = searchParams.get('userId') || ''

    const existing = await db.dailyTask.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (hardDelete) {
      // Hard delete - cascade will handle related records
      await db.dailyTask.delete({ where: { id } })
      await db.auditLog.create({
        data: {
          userId: userId || undefined,
          action: 'DELETE_TASK',
          entityType: 'DailyTask',
          entityId: id,
          details: `Hard deleted task ${existing.taskId}: ${existing.title}`,
        },
      })
      return NextResponse.json({ success: true, message: 'Task permanently deleted' })
    }

    // Soft delete via status CANCELLED
    const task = await db.dailyTask.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completionDate: null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } },
        labels: { select: { id: true, name: true, color: true } },
      },
    })

    // Create history entry for cancellation
    await db.taskHistory.create({
      data: {
        taskId: id,
        userId: userId || existing.assignedById || '',
        action: 'STATUS_CHANGE',
        field: 'status',
        oldValue: existing.status,
        newValue: 'CANCELLED',
        details: `Task cancelled (soft delete): ${existing.status} -> CANCELLED`,
      },
    })

    // Notification for assignee if exists
    if (existing.assignedToId) {
      await db.taskNotification.create({
        data: {
          userId: existing.assignedToId,
          taskId: id,
          title: 'Task Cancelled',
          message: `Task ${existing.taskId}: ${existing.title} has been cancelled`,
          type: 'CANCELLATION',
        },
      })
    }

    await db.auditLog.create({
      data: {
        userId: userId || undefined,
        action: 'DELETE_TASK',
        entityType: 'DailyTask',
        entityId: id,
        details: `Soft deleted (cancelled) task ${existing.taskId}: ${existing.title}`,
      },
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
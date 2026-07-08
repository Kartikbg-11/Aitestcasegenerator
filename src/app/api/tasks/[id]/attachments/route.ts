import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/[id]/attachments
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await db.dailyTask.findUnique({ where: { id }, select: { id: true } })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const attachments = await db.taskAttachment.findMany({
      where: { taskId: id },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/attachments
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { fileName, fileType, filePath, fileSize, uploadedById } = body

    if (!fileName || !uploadedById) {
      return NextResponse.json({ error: 'fileName and uploadedById are required' }, { status: 400 })
    }

    const task = await db.dailyTask.findUnique({
      where: { id },
      include: { assignedTo: { select: { id: true } } },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const attachment = await db.taskAttachment.create({
      data: {
        taskId: id,
        fileName,
        fileType: fileType || 'application/octet-stream',
        filePath: filePath || `/uploads/tasks/${fileName}`,
        fileSize: fileSize || 0,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    })

    // Create history entry
    await db.taskHistory.create({
      data: {
        taskId: id,
        userId: uploadedById,
        action: 'ATTACHMENT_ADDED',
        details: `Attachment added: ${fileName} (${(fileSize || 0) / 1024}KB)`,
      },
    })

    // Notify assignee if different from uploader
    if (task.assignedToId && task.assignedToId !== uploadedById) {
      await db.taskNotification.create({
        data: {
          userId: task.assignedToId,
          taskId: id,
          title: 'New Attachment on Task',
          message: `${fileName} was attached to task ${task.taskId}`,
          type: 'ATTACHMENT',
        },
      })
    }

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Upload attachment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]/attachments?attachmentId=xxx
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')
    const userId = searchParams.get('userId')

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId query param is required' }, { status: 400 })
    }

    const task = await db.dailyTask.findUnique({ where: { id }, select: { id: true, taskId: true } })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const attachment = await db.taskAttachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment || attachment.taskId !== id) {
      return NextResponse.json({ error: 'Attachment not found for this task' }, { status: 404 })
    }

    await db.taskAttachment.delete({ where: { id: attachmentId } })

    // Create history entry
    await db.taskHistory.create({
      data: {
        taskId: id,
        userId: userId || '',
        action: 'ATTACHMENT_REMOVED',
        details: `Attachment removed: ${attachment.fileName}`,
      },
    })

    return NextResponse.json({ success: true, message: 'Attachment deleted' })
  } catch (error) {
    console.error('Delete attachment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
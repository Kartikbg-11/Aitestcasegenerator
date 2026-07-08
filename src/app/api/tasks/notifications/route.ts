import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks/notifications?userId=xxx&unreadOnly=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type

    const [notifications, unreadCount, totalCount] = await Promise.all([
      db.taskNotification.findMany({
        where,
        include: {
          task: {
            select: { id: true, taskId: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.taskNotification.count({
        where: { userId, isRead: false },
      }),
      db.taskNotification.count({ where }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/tasks/notifications - Mark notifications as read
// Body: { notificationIds: string[] } or { markAll: true, userId: string }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, markAll, userId } = body

    if (markAll && userId) {
      // Mark all notifications as read for a user
      const result = await db.taskNotification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} notifications as read`,
        count: result.count,
      })
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'notificationIds array is required (or use markAll with userId)' },
        { status: 400 },
      )
    }

    const result = await db.taskNotification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead: true },
    })

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const defect = await db.defect.findUnique({ where: { id }, select: { id: true } })
    if (!defect) return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    const comments = await db.defectComment.findMany({
      where: { defectId: id },
      include: { user: { select: { id: true, firstName: true, lastName: true, username: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(comments)
  } catch (error) {
    console.error('List comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, comment } = body
    if (!userId || !comment || !comment.trim()) return NextResponse.json({ error: 'userId and comment are required' }, { status: 400 })
    const defect = await db.defect.findUnique({ where: { id } })
    if (!defect) return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    const defectComment = await db.defectComment.create({
      data: { defectId: id, userId, comment: comment.trim() },
      include: { user: { select: { id: true, firstName: true, lastName: true, username: true, role: true } } },
    })
    await db.defectHistory.create({ data: { defectId: id, userId, action: 'COMMENT_ADDED', details: `Comment: ${comment.trim().substring(0, 100)}` } })
    return NextResponse.json(defectComment, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
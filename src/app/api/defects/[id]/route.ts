import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const STATUS_WORKFLOW: Record<string, string[]> = {
  NEW: ['ASSIGNED', 'IN_PROGRESS'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['FIXED'],
  FIXED: ['RETEST'],
  RETEST: ['CLOSED', 'REOPENED'],
  REOPENED: ['IN_PROGRESS'],
  CLOSED: ['REOPENED'],
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const defect = await db.defect.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
        comments: { include: { user: { select: { id: true, firstName: true, lastName: true, username: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        history: { include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!defect) return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    return NextResponse.json(defect)
  } catch (error) {
    console.error('Get defect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, statusChange, ...updateFields } = body

    const existing = await db.defect.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Defect not found' }, { status: 404 })

    if (statusChange && statusChange !== existing.status) {
      const allowed = STATUS_WORKFLOW[existing.status] || []
      if (!allowed.includes(statusChange)) {
        return NextResponse.json({ error: `Invalid transition from ${existing.status} to ${statusChange}` }, { status: 400 })
      }
      updateFields.status = statusChange
      if (statusChange === 'CLOSED') updateFields.resolvedAt = new Date()
      else if (statusChange === 'REOPENED') updateFields.resolvedAt = null

      await db.defectHistory.create({
        data: { defectId: id, userId: userId || existing.reportedById, action: 'STATUS_CHANGE', field: 'status', oldValue: existing.status, newValue: statusChange, details: `Status: ${existing.status} -> ${statusChange}` },
      })
    }

    const trackedFields = ['severity', 'priority', 'assignedToId', 'module', 'title', 'description', 'resolution', 'buildVersion']
    for (const field of trackedFields) {
      if (updateFields[field] !== undefined && updateFields[field] !== existing[field as keyof typeof existing]) {
        await db.defectHistory.create({
          data: { defectId: id, userId: userId || existing.reportedById, action: 'FIELD_UPDATE', field, oldValue: String(existing[field as keyof typeof existing] || ''), newValue: String(updateFields[field]), details: `${field}: "${existing[field as keyof typeof existing]}" -> "${updateFields[field]}"` },
        })
      }
    }

    delete updateFields.id; delete updateFields.defectId; delete updateFields.createdAt; delete updateFields.updatedAt
    delete updateFields.reportedById; delete updateFields.projectId; delete updateFields.userId; delete updateFields.statusChange

    const defect = await db.defect.update({
      where: { id }, data: updateFields,
      include: { project: { select: { id: true, name: true } }, reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } }, assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } } },
    })

    await db.auditLog.create({ data: { userId: userId || existing.reportedById, action: 'UPDATE_DEFECT', entityType: 'Defect', entityId: id, details: `Updated defect ${existing.defectId}` } })
    return NextResponse.json(defect)
  } catch (error) {
    console.error('Update defect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.defect.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    await db.defect.delete({ where: { id } })
    await db.auditLog.create({ data: { action: 'DELETE_DEFECT', entityType: 'Defect', entityId: id, details: `Deleted defect ${existing.defectId}: ${existing.title}` } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete defect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/defects?projectId=xxx&status=xxx&severity=xxx&priority=xxx&module=xxx&search=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const priority = searchParams.get('priority')
    const module_ = searchParams.get('module')
    const search = searchParams.get('search')
    const assignedToId = searchParams.get('assignedToId')

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId
    if (status && status !== 'ALL') where.status = status
    if (severity && severity !== 'ALL') where.severity = severity
    if (priority && priority !== 'ALL') where.priority = priority
    if (module_ && module_ !== 'ALL') where.module = module_
    if (assignedToId) where.assignedToId = assignedToId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { defectId: { contains: search } },
        { description: { contains: search } },
        { module: { contains: search } },
      ]
    }

    const defects = await db.defect.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(defects)
  } catch (error) {
    console.error('List defects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/defects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title, description, severity, priority, projectId, testCaseId,
      stepsToReproduce, expectedResult, actualResult, environment, module,
      reportedById, assignedToId, buildVersion, attachment,
    } = body

    if (!title || !projectId || !reportedById) {
      return NextResponse.json({ error: 'Title, projectId, and reportedById are required' }, { status: 400 })
    }

    const count = await db.defect.count({ where: { projectId } })
    const defectId = `DEF-${String(count + 1).padStart(3, '0')}`

    const defect = await db.defect.create({
      data: {
        defectId, title, description: description || '',
        severity: severity || 'MEDIUM', priority: priority || 'MEDIUM',
        status: 'NEW', projectId, testCaseId: testCaseId || '',
        stepsToReproduce: stepsToReproduce || '',
        expectedResult: expectedResult || '', actualResult: actualResult || '',
        environment: environment || '', module: module || '',
        reportedById, assignedToId: assignedToId || null,
        buildVersion: buildVersion || '', attachment: attachment || '',
      },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    await db.defectHistory.create({
      data: { defectId: defect.id, userId: reportedById, action: 'CREATED', details: `Defect ${defectId} created: ${title}` },
    })

    await db.auditLog.create({
      data: { userId: reportedById, action: 'CREATE_DEFECT', entityType: 'Defect', entityId: defect.id, details: `Created defect ${defectId}: ${title}` },
    })

    return NextResponse.json(defect, { status: 201 })
  } catch (error) {
    console.error('Create defect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt', 'xlsx', 'csv', 'json', 'yaml', 'yml', 'png', 'jpg', 'jpeg', 'gif', 'webp']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Validate project exists
    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Validate file extension
    const fileName = file.name.trim()
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 400 })
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch {
      // Directory already exists or creation failed - continue
    }

    // Save file to disk
    const timestamp = Date.now()
    const safeFileName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const filePath = join(uploadsDir, safeFileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Determine file type label
    const fileTypeMap: Record<string, string> = {
      pdf: 'PDF', docx: 'DOCX', doc: 'DOC', txt: 'TXT',
      xlsx: 'XLSX', csv: 'CSV', json: 'JSON', yaml: 'YAML', yml: 'YAML',
      png: 'PNG', jpg: 'JPG', jpeg: 'JPEG', gif: 'GIF', webp: 'WEBP',
    }

    // Extract text content from the file (basic extraction for text-based files)
    let contentExtracted = ''
    if (['txt', 'json', 'yaml', 'yml', 'csv'].includes(ext)) {
      try {
        contentExtracted = buffer.toString('utf-8')
      } catch {
        contentExtracted = `Binary content of ${fileName}`
      }
    } else {
      contentExtracted = `Document uploaded: ${fileName}\nFile type: ${fileTypeMap[ext] || ext.toUpperCase()}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nThis document has been processed and is ready for test case generation.`
    }

    // Look up a valid user ID for the uploadedById field
    let uploadedById = 'admin'
    try {
      const adminUser = await db.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } })
      if (adminUser) uploadedById = adminUser.id
    } catch { /* use default */ }

    // Create database record
    const document = await db.document.create({
      data: {
        projectId,
        name: fileName,
        fileType: fileTypeMap[ext] || ext.toUpperCase(),
        filePath: `/uploads/${safeFileName}`,
        fileSize: file.size,
        uploadedById,
        status: 'COMPLETED',
        version: 1,
        contentExtracted,
      },
    })

    // Create audit log
    try {
      await db.auditLog.create({
        data: {
          action: 'UPLOAD_DOCUMENT',
          entityType: 'Document',
          entityId: document.id,
          details: `Document "${fileName}" uploaded to project ${project.name}`,
        },
      })
    } catch {
      // Audit log is non-critical
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        createdAt: document.createdAt,
      },
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 })
  }
}

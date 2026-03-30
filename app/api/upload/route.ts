import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, validateFileType, getMaxFileSize } from '@/lib/files/upload'
import { parseCSV, parseExcel, buildSchemaFromParsedFile, createTempTable } from '@/lib/db/connectors/file-tabular'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = session.user.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 })
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
      select: { role: true, workspace: { select: { plan: true } } },
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can upload files' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const typeCheck = validateFileType(file.name)
    if (!typeCheck.valid || !typeCheck.type) {
      return NextResponse.json(
        { error: `Unsupported file type. Please upload a CSV or Excel file.` },
        { status: 400 }
      )
    }

    const plan = membership.workspace.plan
    const maxSize = getMaxFileSize(plan)
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return NextResponse.json(
        { error: `File exceeds the ${maxMB}MB limit for your plan.` },
        { status: 400 }
      )
    }

    const objectKey = await uploadFile(file, workspaceId, file.name)
      .then((result) => result.objectKey)
      .catch(() => null)

    const fileType = typeCheck.type
    let columns: string[] = []
    let rows: Record<string, unknown>[] = []
    let rowCount = 0

    if (fileType === 'csv') {
      const text = await file.text()
      const parsed = await parseCSV(text)
      columns = parsed.columns
      rows = parsed.rows
      rowCount = parsed.rowCount
    } else {
      const buffer = Buffer.from(await file.arrayBuffer())
      const parsed = await parseExcel(buffer)
      columns = parsed.columns
      rows = parsed.rows
      rowCount = parsed.rowCount
    }

    const connectionName = name || file.name.replace(/\.[^/.]+$/, '')

    const tableName = connectionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 50)

    if (columns.length > 0 && rows.length > 0) {
      try {
        await createTempTable(tableName, columns, rows)
      } catch (duckdbError) {
        console.error('DuckDB temp table creation failed:', duckdbError)
      }
    }

    const schema = buildSchemaFromParsedFile(tableName, columns, rows)

    const connection = await prisma.dataConnection.create({
      data: {
        workspaceId,
        name: connectionName,
        type: fileType === 'csv' ? 'CSV' : 'EXCEL',
        status: 'ACTIVE',
        credentials: {
          fileName: file.name,
          sheetName: fileType === 'excel' ? 'Sheet1' : undefined,
          rowCount,
          columnCount: columns.length,
          tableName,
        },
        schemaCache: schema as unknown as import('@prisma/client').Prisma.InputJsonValue,
        fileObjectKey: objectKey,
        fileSizeBytes: file.size,
        lastTestedAt: new Date(),
      },
    })

    return NextResponse.json(
      {
        connection: {
          id: connection.id,
          name: connection.name,
          type: connection.type,
          status: connection.status,
          fileSizeBytes: connection.fileSizeBytes,
          lastTestedAt: connection.lastTestedAt,
          createdAt: connection.createdAt,
        },
        meta: {
          rowCount,
          columnCount: columns.length,
          columns,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

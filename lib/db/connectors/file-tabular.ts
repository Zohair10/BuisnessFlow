import type { SchemaInfo } from '@/types/connection'

const MAX_ROWS = 10000
const QUERY_TIMEOUT_MS = 10000

interface ParseResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

interface QueryResult {
  rows: Record<string, unknown>[]
  rowCount: number
  durationMs: number
}

let duckdbInstance: any | null = null
let duckdbConn: unknown = null
let duckdbAvailable = false

async function getDuckDB(): Promise<{ db: unknown; conn: unknown } | null> {
  if (duckdbInstance && duckdbConn) {
    return { db: duckdbInstance, conn: duckdbConn }
  }

  try {
    const duckdb = await import('duckdb')
    duckdbInstance = new (duckdb as any).Database(':memory:')
    duckdbConn = await new Promise<unknown>((resolve, reject) => {
      duckdbInstance!.connect((err: Error | null, conn: unknown) => {
        if (err) reject(err)
        else resolve(conn)
      })
    })
    duckdbAvailable = true
    return { db: duckdbInstance, conn: duckdbConn }
  } catch {
    duckdbAvailable = false
    return null
  }
}

async function duckDBRun(
  conn: unknown,
  sql: string
): Promise<Record<string, unknown>[]> {
  const connection = conn as any
  return new Promise((resolve, reject) => {
    connection.all(sql, (err: Error | null, rows: Record<string, unknown>[]) => {
      if (err) reject(err)
      else resolve(rows ?? [])
    })
  })
}

function inferColumnType(values: unknown[]): string {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '')
  if (nonNull.length === 0) return 'TEXT'

  const sample = nonNull.slice(0, 100)

  const allNumbers = sample.every((v) => !isNaN(Number(v)) && String(v).trim() !== '')
  if (allNumbers) {
    const hasDecimal = sample.some((v) => String(v).includes('.'))
    return hasDecimal ? 'DOUBLE' : 'INTEGER'
  }

  const allDates = sample.every((v) => {
    const d = new Date(v as string)
    return !isNaN(d.getTime()) && typeof v === 'string' && v.length > 6
  })
  if (allDates) return 'TIMESTAMP'

  const allBooleans = sample.every(
    (v) =>
      v === 'true' ||
      v === 'false' ||
      v === 'TRUE' ||
      v === 'FALSE' ||
      v === '1' ||
      v === '0'
  )
  if (allBooleans) return 'BOOLEAN'

  return 'TEXT'
}

function sanitizeColumnName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    || 'column'
}

function escapeColumnName(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

export async function parseCSV(content: string): Promise<ParseResult> {
  const Papa = (await import('papaparse')).default
  const result = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  const rawColumns = result.meta.fields ?? []
  const rows = (result.data as Record<string, unknown>[]).slice(0, MAX_ROWS)
  const columns = rawColumns.map(sanitizeColumnName)

  const mappedRows = rows.map((row) => {
    const mapped: Record<string, unknown> = {}
    for (let i = 0; i < rawColumns.length; i++) {
      mapped[columns[i]] = row[rawColumns[i]]
    }
    return mapped
  })

  return { columns, rows: mappedRows, rowCount: mappedRows.length }
}

export async function parseExcel(
  buffer: Buffer
): Promise<ParseResult> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  })

  const rows = jsonData.slice(0, MAX_ROWS)

  if (rows.length === 0) {
    return { columns: [], rows: [], rowCount: 0 }
  }

  const rawColumns = Object.keys(rows[0])
  const columns = rawColumns.map(sanitizeColumnName)

  const mappedRows = rows.map((row) => {
    const mapped: Record<string, unknown> = {}
    for (let i = 0; i < rawColumns.length; i++) {
      mapped[columns[i]] = row[rawColumns[i]]
    }
    return mapped
  })

  return { columns, rows: mappedRows, rowCount: mappedRows.length }
}

export async function createTempTable(
  tableName: string,
  columns: string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  const duck = await getDuckDB()
  if (!duck) return

  const safeTableName = sanitizeColumnName(tableName)

  const columnTypes = columns.map((col) => {
    const values = rows.map((r) => r[col])
    const type = inferColumnType(values)
    return `${escapeColumnName(col)} ${type}`
  })

  const createSQL = `CREATE TABLE IF NOT EXISTS ${escapeColumnName(safeTableName)} (${columnTypes.join(', ')})`
  await duckDBRun(duck.conn, `DROP TABLE IF EXISTS ${escapeColumnName(safeTableName)}`)
  await duckDBRun(duck.conn, createSQL)

  if (rows.length === 0) return

  for (const row of rows) {
    const values = columns.map((col) => {
      const val = row[col]
      if (val === null || val === undefined || val === '') return 'NULL'
      if (typeof val === 'number') return String(val)
      return `'${String(val).replace(/'/g, "''")}'`
    })
    const insertSQL = `INSERT INTO ${escapeColumnName(safeTableName)} (${columns.map(escapeColumnName).join(', ')}) VALUES (${values.join(', ')})`
    await duckDBRun(duck.conn, insertSQL)
  }
}

export async function queryTempTable(sql: string): Promise<QueryResult> {
  const duck = await getDuckDB()

  if (duck) {
    const start = performance.now()
    const rows = await duckDBRun(duck.conn, sql)
    const durationMs = Math.round(performance.now() - start)
    return {
      rows: rows.slice(0, MAX_ROWS),
      rowCount: rows.length,
      durationMs,
    }
  }

  throw new Error(
    'No query engine available. DuckDB is not installed and in-memory fallback does not support arbitrary SQL.'
  )
}

export function buildSchemaFromParsedFile(
  tableName: string,
  columns: string[],
  rows: Record<string, unknown>[]
): SchemaInfo {
  const columnDefs = columns.map((col) => {
    const values = rows.map((r) => r[col])
    return {
      name: col,
      type: inferColumnType(values),
      nullable: values.some((v) => v === null || v === undefined || v === ''),
    }
  })

  return {
    tables: [
      {
        name: tableName,
        columns: columnDefs,
        rowCount: rows.length,
      },
    ],
  }
}

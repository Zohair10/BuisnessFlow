import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ParsedFile {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

export async function parseCSV(content: string | Buffer): Promise<ParsedFile> {
  const result = Papa.parse(content.toString(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })

  const columns = result.meta.fields || []
  const rows = result.data as Record<string, unknown>[]

  return { columns, rows, rowCount: rows.length }
}

export async function parseExcel(buffer: Buffer, sheetName?: string): Promise<ParsedFile> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = sheetName
    ? workbook.Sheets[sheetName]
    : workbook.Sheets[workbook.SheetNames[0]]

  if (!sheet) {
    throw new Error(`Sheet "${sheetName || workbook.SheetNames[0]}" not found`)
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  })

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return { columns, rows, rowCount: rows.length }
}

export async function parseFile(
  buffer: Buffer,
  fileName: string
): Promise<ParsedFile> {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return parseCSV(buffer)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(buffer)
  }

  throw new Error(`Unsupported file type: ${ext}`)
}

let duckdbInstance: any = null

async function getDuckDB(): Promise<any> {
  if (duckdbInstance) return duckdbInstance

  try {
    const duckdb = await import('duckdb')
    const db = new duckdb.Database(':memory:')
    duckdbInstance = db
    return db
  } catch {
    return null
  }
}

export async function queryFileData(
  tableName: string,
  sql: string,
  columns: string[],
  rows: Record<string, unknown>[]
): Promise<{ rows: Record<string, unknown>[]; rowCount: number; durationMs: number }> {
  const start = Date.now()

  const db = await getDuckDB()

  if (!db) {
    return inMemoryQuery(sql, columns, rows)
  }

  return new Promise((resolve, reject) => {
    db.run('CREATE TABLE IF NOT EXISTS ' + sanitizeTableName(tableName) + ' (' +
      columns.map(col => `"${col}" VARCHAR`).join(', ') + ')',
      (err: Error | null) => {
        if (err) {
          resolve(inMemoryQuery(sql, columns, rows))
          return
        }

        const sanitizedTableName = sanitizeTableName(tableName)
        const insertValues = rows.slice(0, 10000).map(row =>
          '(' + columns.map(col => {
            const val = row[col]
            if (val === null || val === undefined) return 'NULL'
            if (typeof val === 'number') return String(val)
            return "'" + String(val).replace(/'/g, "''") + "'"
          }).join(', ') + ')'
        ).join(', ')

        const insertSQL = `INSERT INTO "${sanitizedTableName}" VALUES ${insertValues}`

        db.run(insertSQL, (insertErr: Error | null) => {
          if (insertErr) {
            resolve(inMemoryQuery(sql, columns, rows))
            return
          }

          db.all(sql, (queryErr: Error | null, results: Record<string, unknown>[]) => {
            if (queryErr) {
              reject(queryErr)
              return
            }

            db.run(`DROP TABLE IF EXISTS "${sanitizedTableName}"`)

            resolve({
              rows: results || [],
              rowCount: results?.length || 0,
              durationMs: Date.now() - start,
            })
          })
        })
      }
    )
  })
}

function sanitizeTableName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_')
}

function inMemoryQuery(
  _sql: string,
  columns: string[],
  rows: Record<string, unknown>[]
): { rows: Record<string, unknown>[]; rowCount: number; durationMs: number } {
  const start = Date.now()
  return {
    rows: rows.slice(0, 1000),
    rowCount: rows.length,
    durationMs: Date.now() - start,
  }
}

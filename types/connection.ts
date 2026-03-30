export type ConnectionType = 'POSTGRES' | 'MYSQL' | 'CSV' | 'EXCEL' | 'MONGODB'

export type ConnectionStatus = 'ACTIVE' | 'ERROR' | 'DISABLED'

export interface DataConnection {
  id: string
  workspaceId: string
  name: string
  type: ConnectionType
  status: ConnectionStatus
  schemaCache: Record<string, unknown> | null
  glossaryCache: Record<string, unknown> | null
  fileObjectKey?: string | null
  fileSizeBytes?: number | null
  lastTestedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PostgresCredentials {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
}

export interface MySQLCredentials {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
}

export interface MongoCredentials {
  uri: string
  database: string
}

export interface FileConnectionMeta {
  fileName: string
  sheetName?: string
  rowCount: number
  columnCount: number
}

export type ConnectorCredentials =
  | PostgresCredentials
  | MySQLCredentials
  | MongoCredentials
  | FileConnectionMeta

export interface SchemaInfo {
  tables: Array<{
    name: string
    schema?: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      description?: string
    }>
    rowCount?: number
  }>
  relationships?: Array<{
    from: { table: string; column: string }
    to: { table: string; column: string }
    type: 'one-to-many' | 'many-to-many'
  }>
}

export interface CreateConnectionInput {
  name: string
  type: ConnectionType
  credentials: ConnectorCredentials
  file?: File
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  schema?: SchemaInfo
  latencyMs?: number
}

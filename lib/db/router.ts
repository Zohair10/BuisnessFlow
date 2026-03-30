import type { ConnectionType, SchemaInfo, PostgresCredentials, MySQLCredentials, MongoCredentials } from '@/types/connection'
import * as postgresConnector from './connectors/postgres'
import * as mysqlConnector from './connectors/mysql'
import * as mongoConnector from './connectors/mongodb'
import * as fileConnector from './connectors/file-tabular'

type RelationalCredentials = PostgresCredentials | MySQLCredentials

interface RelationalConnector {
  test: (creds: RelationalCredentials) => Promise<{ success: boolean; message: string }>
  execute: (creds: RelationalCredentials, query: string) => Promise<{ rows: Record<string, unknown>[]; rowCount: number; durationMs: number }>
  introspect: (creds: RelationalCredentials) => Promise<SchemaInfo>
}

interface MongoConnector {
  test: (creds: MongoCredentials) => Promise<{ success: boolean; message: string }>
  executePipeline: (creds: MongoCredentials, collectionName: string, pipeline: Record<string, unknown>[]) => Promise<{ docs: Record<string, unknown>[]; rowCount: number; durationMs: number }>
  introspect: (creds: MongoCredentials) => Promise<SchemaInfo>
}

interface FileConnector {
  parseCSV: typeof fileConnector.parseCSV
  parseExcel: typeof fileConnector.parseExcel
  createTempTable: typeof fileConnector.createTempTable
  queryTempTable: typeof fileConnector.queryTempTable
  buildSchemaFromParsedFile: typeof fileConnector.buildSchemaFromParsedFile
}

type Connector = RelationalConnector | MongoConnector | FileConnector

export function getConnector(type: ConnectionType): Connector {
  switch (type) {
    case 'POSTGRES':
      return {
        test: (creds: RelationalCredentials) => postgresConnector.testConnection(creds as PostgresCredentials),
        execute: (creds: RelationalCredentials, query: string) => postgresConnector.executeQuery(creds as PostgresCredentials, query),
        introspect: (creds: RelationalCredentials) => postgresConnector.introspectSchema(creds as PostgresCredentials),
      }

    case 'MYSQL':
      return {
        test: (creds: RelationalCredentials) => mysqlConnector.testConnection(creds as MySQLCredentials),
        execute: (creds: RelationalCredentials, query: string) => mysqlConnector.executeQuery(creds as MySQLCredentials, query),
        introspect: (creds: RelationalCredentials) => mysqlConnector.introspectSchema(creds as MySQLCredentials),
      }

    case 'MONGODB':
      return {
        test: (creds: MongoCredentials) => mongoConnector.testConnection(creds as MongoCredentials),
        executePipeline: (creds: MongoCredentials, collectionName: string, pipeline: Record<string, unknown>[]) =>
          mongoConnector.executePipeline(creds as MongoCredentials, collectionName, pipeline),
        introspect: (creds: MongoCredentials) => mongoConnector.introspectSchema(creds as MongoCredentials),
      } as MongoConnector

    case 'CSV':
    case 'EXCEL':
      return {
        parseCSV: fileConnector.parseCSV,
        parseExcel: fileConnector.parseExcel,
        createTempTable: fileConnector.createTempTable,
        queryTempTable: fileConnector.queryTempTable,
        buildSchemaFromParsedFile: fileConnector.buildSchemaFromParsedFile,
      } as FileConnector

    default:
      throw new Error(`Unsupported connection type: ${type}`)
  }
}

export function isRelationalConnector(connector: Connector): connector is RelationalConnector {
  return 'execute' in connector && typeof (connector as RelationalConnector).execute === 'function'
}

export function isMongoConnector(connector: Connector): connector is MongoConnector {
  return 'executePipeline' in connector && typeof (connector as MongoConnector).executePipeline === 'function'
}

export function isFileConnector(connector: Connector): connector is FileConnector {
  return 'parseCSV' in connector && typeof (connector as FileConnector).parseCSV === 'function'
}

const DANGEROUS_FUNCTIONS = [
  'pg_sleep',
  'pg_terminate_backend',
  'pg_cancel_backend',
  'pg_read_file',
  'pg_write_file',
  'pg_ls_dir',
  'pg_stat_file',
  'lo_import',
  'lo_export',
  'LOAD_FILE',
  'INTO OUTFILE',
  'INTO DUMPFILE',
  'BENCHMARK',
  'SLEEP',
  'GET_LOCK',
  'RELEASE_LOCK',
  'sys_exec',
  'sys_eval',
  'sys_get',
  'sys_set',
  'COPY',
  'CREATE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'INSERT',
  'UPDATE',
  'DELETE',
  'REPLACE',
  'RENAME',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
  'CALL',
  'DECLARE',
  'DO',
  'RESET',
  'SET',
  'COMMENT',
  'VACUUM',
  'ANALYZE',
  'EXPLAIN',
  'PREPARE',
  'DEALLOCATE',
  'LISTEN',
  'NOTIFY',
  'UNLISTEN',
  'LOAD',
  'CLUSTER',
  'REINDEX',
  'DISCARD',
  'CHECKPOINT',
  'REASSIGN OWNED',
  'SECURITY LABEL',
]

const DANGEROUS_PATTERNS = [
  /;\s*\w/i,
  /--\s/,
  /\/\*/,
  /\*\//,
  /\bINFORMATION_SCHEMA\b/i,
  /\bPG_CATALOG\b/i,
  /\bPG_TOAST\b/i,
  /\bSYS\b\.\b/i,
  /\bMYSQL\b\.\b/i,
  /\bPERFORMANCE_SCHEMA\b/i,
  /\bpg_class\b/i,
  /\bpg_namespace\b/i,
  /\bpg_attribute\b/i,
  /\bpg_proc\b/i,
  /\bpg_roles\b/i,
  /\bpg_authid\b/i,
  /\bpg_shadow\b/i,
  /\bpg_group\b/i,
  /\bUSER_PASSWORD/i,
  /\bCURRENT_USER\b/i,
  /\bSESSION_USER\b/i,
  /\bSYSTEM_USER\b/i,
  /\bVERSION\b\s*\(\s*\)/i,
  /\b@@/i,
  /\bCHAR\s*\(\s*\d+\s*\)/i,
  /\bCONCAT\s*\(\s*0x/i,
  /\b0x[0-9a-fA-F]/i,
]

const MAX_QUERY_LENGTH = 10000

export interface SanitizeResult {
  safe: boolean
  reason?: string
}

export function sanitizeSQL(sql: string): SanitizeResult {
  if (!sql || typeof sql !== 'string') {
    return { safe: false, reason: 'Query is empty or not a string' }
  }

  const trimmed = sql.trim()

  if (trimmed.length === 0) {
    return { safe: false, reason: 'Query is empty' }
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return { safe: false, reason: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` }
  }

  const upperTrimmed = trimmed.toUpperCase()

  if (!upperTrimmed.startsWith('SELECT') && !upperTrimmed.startsWith('WITH')) {
    return { safe: false, reason: 'Only SELECT queries are allowed' }
  }

  for (const keyword of DANGEROUS_FUNCTIONS) {
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (regex.test(trimmed)) {
      return { safe: false, reason: `Dangerous keyword or function detected: ${keyword}` }
    }
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: `Potentially dangerous SQL pattern detected: ${pattern.source}` }
    }
  }

  const semicolonCount = (trimmed.match(/;/g) || []).length
  if (semicolonCount > 1) {
    return { safe: false, reason: 'Multiple statements are not allowed' }
  }

  if (semicolonCount === 1 && !trimmed.endsWith(';')) {
    return { safe: false, reason: 'Semicolons are only allowed at the end of the query' }
  }

  const withMatch = upperTrimmed.match(/\bWITH\b/i)
  if (withMatch) {
    const afterWith = trimmed.substring(withMatch.index! + 4).trim()
    const selectInCTAS = /\bAS\b\s*\([^)]*\)\s*\bSELECT\b/i.test(afterWith)
    if (selectInCTAS) {
      return { safe: false, reason: 'CTAS (CREATE TABLE AS SELECT) is not allowed' }
    }
  }

  return { safe: true }
}

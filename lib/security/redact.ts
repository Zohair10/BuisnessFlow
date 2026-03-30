const SENSITIVE_PATTERNS = [
  /email/i,
  /phone/i,
  /address/i,
  /ssn/i,
  /national.?id/i,
  /token/i,
  /secret/i,
  /api.?key/i,
  /password/i,
  /credit.?card/i,
  /social.?security/i,
]

export function isSensitiveColumn(columnName: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(columnName))
}

export function maskValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length <= 2) return '**'
    return value.slice(0, 2) + '*'.repeat(Math.min(value.length - 2, 10))
  }
  return '***'
}

export function redactSensitiveColumns(
  data: Record<string, unknown>[],
  strictMode: boolean = false
): Record<string, unknown>[] {
  if (!data || data.length === 0) return data

  const sensitiveKeys = Object.keys(data[0]).filter(isSensitiveColumn)

  if (sensitiveKeys.length === 0) return data

  return data.map(row => {
    const redacted = { ...row }
    for (const key of sensitiveKeys) {
      if (strictMode) {
        delete (redacted as Record<string, unknown>)[key]
      } else {
        (redacted as Record<string, unknown>)[key] = maskValue(row[key])
      }
    }
    return redacted
  })
}

export function filterForLLM(
  data: Record<string, unknown>[],
  maxRows: number = 100
): Record<string, unknown>[] {
  const redacted = redactSensitiveColumns(data)
  return redacted.slice(0, maxRows)
}

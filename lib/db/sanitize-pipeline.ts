const ALLOWED_STAGES = new Set([
  '$match',
  '$group',
  '$project',
  '$sort',
  '$limit',
  '$skip',
  '$count',
  '$unwind',
  '$addFields',
  '$set',
  '$unset',
  '$lookup',
  '$facet',
  '$bucket',
  '$bucketAuto',
  '$sortByCount',
  '$densify',
  '$fill',
])

const DANGEROUS_OPERATORS = [
  '$where',
  '$function',
  '$accumulator',
  '$expr',
  '$jsonSchema',
]

const DANGEROUS_FUNCTIONS_IN_EXPRESSIONS = [
  '$function',
  '$accumulator',
  'function(',
  'function (',
  '=>',
  'eval(',
  'tojson',
  'tojsonobj',
  'printjson',
  'ObjectId',
  'BinData',
  'UUID',
]

export interface SanitizePipelineResult {
  safe: boolean
  reason?: string
}

function checkValue(value: unknown, path: string): SanitizePipelineResult {
  if (value === null || value === undefined) {
    return { safe: true }
  }

  if (typeof value === 'string') {
    const lowerVal = value.toLowerCase()
    for (const fn of DANGEROUS_FUNCTIONS_IN_EXPRESSIONS) {
      if (lowerVal.includes(fn.toLowerCase())) {
        return {
          safe: false,
          reason: `Dangerous expression detected in ${path}: ${fn}`,
        }
      }
    }
    return { safe: true }
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return { safe: true }
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const result = checkValue(value[i], `${path}[${i}]`)
      if (!result.safe) return result
    }
    return { safe: true }
  }

  if (typeof value === 'object') {
    return checkObject(value as Record<string, unknown>, path)
  }

  return { safe: true }
}

function checkObject(obj: Record<string, unknown>, path: string): SanitizePipelineResult {
  for (const [key, val] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key

    if (DANGEROUS_OPERATORS.includes(key)) {
      return {
        safe: false,
        reason: `Dangerous operator "${key}" is not allowed at ${currentPath}`,
      }
    }

    if (key.startsWith('$') && !key.startsWith('$')) {
      continue
    }

    if (typeof val === 'string') {
      const lowerVal = val.toLowerCase()
      for (const fn of DANGEROUS_FUNCTIONS_IN_EXPRESSIONS) {
        if (lowerVal.includes(fn.toLowerCase())) {
          return {
            safe: false,
            reason: `Dangerous expression in ${currentPath}: contains ${fn}`,
          }
        }
      }
    }

    const nestedResult = checkValue(val, currentPath)
    if (!nestedResult.safe) return nestedResult
  }

  return { safe: true }
}

export function sanitizePipeline(
  pipeline: Record<string, unknown>[]
): SanitizePipelineResult {
  if (!Array.isArray(pipeline)) {
    return { safe: false, reason: 'Pipeline must be an array' }
  }

  if (pipeline.length === 0) {
    return { safe: false, reason: 'Pipeline cannot be empty' }
  }

  if (pipeline.length > 50) {
    return { safe: false, reason: 'Pipeline exceeds maximum of 50 stages' }
  }

  for (let i = 0; i < pipeline.length; i++) {
    const stage = pipeline[i]
    if (typeof stage !== 'object' || stage === null || Array.isArray(stage)) {
      return {
        safe: false,
        reason: `Stage ${i} must be an object`,
      }
    }

    const keys = Object.keys(stage)
    if (keys.length === 0) {
      return {
        safe: false,
        reason: `Stage ${i} is empty`,
      }
    }

    for (const stageKey of keys) {
      if (!stageKey.startsWith('$')) {
        return {
          safe: false,
          reason: `Invalid stage key "${stageKey}" at stage ${i}. Stage keys must start with $`,
        }
      }

      if (!ALLOWED_STAGES.has(stageKey)) {
        return {
          safe: false,
          reason: `Stage "${stageKey}" at position ${i} is not in the allowed stages list. Allowed: ${Array.from(ALLOWED_STAGES).join(', ')}`,
        }
      }

      const valueResult = checkValue(stage[stageKey], `stage[${i}].${stageKey}`)
      if (!valueResult.safe) return valueResult
    }
  }

  return { safe: true }
}

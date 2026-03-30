import type { QueryPlan } from '@/types/query'

function escapeSqlIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (Array.isArray(value)) {
    const items = value.map((v) => escapeSqlValue(v))
    return `(${items.join(', ')})`
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

function buildSelectClause(plan: QueryPlan): string {
  if (!plan.fields || plan.fields.length === 0) {
    return 'SELECT *'
  }

  const columns = plan.fields.map((field) => {
    const aggMap: Record<string, string> = {
      sum: 'SUM',
      avg: 'AVG',
      count: 'COUNT',
      min: 'MIN',
      max: 'MAX',
      distinct_count: 'COUNT(DISTINCT',
    }

    if (field.agg) {
      if (field.agg === 'distinct_count') {
        const expr = `COUNT(DISTINCT ${escapeSqlIdentifier(field.field)})`
        return field.alias
          ? `${expr} AS ${escapeSqlIdentifier(field.alias)}`
          : expr
      }
      const fn = aggMap[field.agg]
      const expr = `${fn}(${escapeSqlIdentifier(field.field)})`
      return field.alias
        ? `${expr} AS ${escapeSqlIdentifier(field.alias)}`
        : expr
    }

    return escapeSqlIdentifier(field.field)
  })

  return `SELECT ${columns.join(', ')}`
}

function buildFromClause(plan: QueryPlan): string {
  if (!plan.entities || plan.entities.length === 0) {
    throw new Error('QueryPlan has no entities (tables) specified')
  }

  const primary = escapeSqlIdentifier(plan.entities[0])
  return `FROM ${primary}`
}

function buildWhereClause(plan: QueryPlan): string {
  if (!plan.filters || plan.filters.length === 0) return ''

  const conditions = plan.filters.map((filter) => {
    const col = escapeSqlIdentifier(filter.field)

    switch (filter.op) {
      case '=':
        return `${col} = ${escapeSqlValue(filter.value)}`
      case '!=':
        return `${col} != ${escapeSqlValue(filter.value)}`
      case '>':
        return `${col} > ${escapeSqlValue(filter.value)}`
      case '>=':
        return `${col} >= ${escapeSqlValue(filter.value)}`
      case '<':
        return `${col} < ${escapeSqlValue(filter.value)}`
      case '<=':
        return `${col} <= ${escapeSqlValue(filter.value)}`
      case 'in': {
        const vals = Array.isArray(filter.value)
          ? filter.value
          : [filter.value]
        return `${col} IN ${escapeSqlValue(vals)}`
      }
      case 'between': {
        const [lo, hi] = Array.isArray(filter.value)
          ? filter.value
          : [filter.value, filter.value]
        return `${col} BETWEEN ${escapeSqlValue(lo)} AND ${escapeSqlValue(hi)}`
      }
      case 'contains':
        return `${col} LIKE '%${String(filter.value).replace(/'/g, "''")}%'`
      default:
        return `${col} = ${escapeSqlValue(filter.value)}`
    }
  })

  return `WHERE ${conditions.join(' AND ')}`
}

function buildGroupByClause(plan: QueryPlan): string {
  if (!plan.groupBy || plan.groupBy.length === 0) return ''
  const cols = plan.groupBy.map((g) => escapeSqlIdentifier(g))
  return `GROUP BY ${cols.join(', ')}`
}

function buildOrderByClause(plan: QueryPlan): string {
  if (!plan.orderBy || plan.orderBy.length === 0) return ''

  const specs = plan.orderBy.map((o) => {
    const dir = o.direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    return `${escapeSqlIdentifier(o.field)} ${dir}`
  })

  return `ORDER BY ${specs.join(', ')}`
}

function compileToSql(plan: QueryPlan): string {
  const select = buildSelectClause(plan)
  const from = buildFromClause(plan)
  const where = buildWhereClause(plan)
  const groupBy = buildGroupByClause(plan)
  const orderBy = buildOrderByClause(plan)
  const limit = plan.limit ? `LIMIT ${Math.min(plan.limit, 1000)}` : 'LIMIT 100'

  const parts = [select, from]
  if (where) parts.push(where)
  if (groupBy) parts.push(groupBy)
  if (orderBy) parts.push(orderBy)
  parts.push(limit)

  return parts.join(' ')
}

function escapeMongoValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$/g, '\uFF04').replace(/\./g, '\uFF0E')
  }
  return value
}

function compileToMongoPipeline(
  plan: QueryPlan
): Record<string, unknown>[] {
  const pipeline: Record<string, unknown>[] = []

  if (plan.filters && plan.filters.length > 0) {
    const matchConditions: Record<string, unknown> = {}

    for (const filter of plan.filters) {
      let mongoOp: string
      switch (filter.op) {
        case '=':
          mongoOp = '$eq'
          break
        case '!=':
          mongoOp = '$ne'
          break
        case '>':
          mongoOp = '$gt'
          break
        case '>=':
          mongoOp = '$gte'
          break
        case '<':
          mongoOp = '$lt'
          break
        case '<=':
          mongoOp = '$lte'
          break
        case 'in':
          mongoOp = '$in'
          break
        case 'between':
          matchConditions[filter.field] = {
            $gte: escapeMongoValue(
              Array.isArray(filter.value) ? filter.value[0] : filter.value
            ),
            $lte: escapeMongoValue(
              Array.isArray(filter.value) ? filter.value[1] : filter.value
            ),
          }
          continue
        case 'contains':
          matchConditions[filter.field] = {
            $regex: String(filter.value),
            $options: 'i',
          }
          continue
        default:
          mongoOp = '$eq'
      }

      if (mongoOp === '$in') {
        const vals = Array.isArray(filter.value)
          ? filter.value.map(escapeMongoValue)
          : [escapeMongoValue(filter.value)]
        matchConditions[filter.field] = { $in: vals }
      } else {
        matchConditions[filter.field] = {
          [mongoOp]: escapeMongoValue(filter.value),
        }
      }
    }

    pipeline.push({ $match: matchConditions })
  }

  if (plan.groupBy && plan.groupBy.length > 0) {
    const groupId: Record<string, string> = {}
    for (const gb of plan.groupBy) {
      groupId[gb] = `$_${gb}`
    }

    const groupAccumulators: Record<string, unknown> = {}
    if (plan.fields) {
      for (const field of plan.fields) {
        if (!field.agg) continue

        const alias = field.alias || field.field
        switch (field.agg) {
          case 'sum':
            groupAccumulators[alias] = { $sum: `$_${field.field}` }
            break
          case 'avg':
            groupAccumulators[alias] = { $avg: `$_${field.field}` }
            break
          case 'count':
            groupAccumulators[alias] = { $sum: 1 }
            break
          case 'min':
            groupAccumulators[alias] = { $min: `$_${field.field}` }
            break
          case 'max':
            groupAccumulators[alias] = { $max: `$_${field.field}` }
            break
          case 'distinct_count':
            groupAccumulators[alias] = {
              $addToSet: `$_${field.field}`,
            }
            break
        }
      }
    }

    if (!groupAccumulators['count'] && plan.fields?.some((f) => f.agg === 'count')) {
      groupAccumulators['count'] = { $sum: 1 }
    }

    pipeline.push({
      $group: {
        _id: groupId,
        ...groupAccumulators,
      },
    })
  } else if (
    plan.fields &&
    plan.fields.some((f) => f.agg)
  ) {
    const groupAccumulators: Record<string, unknown> = {}
    for (const field of plan.fields) {
      if (!field.agg) continue
      const alias = field.alias || field.field
      switch (field.agg) {
        case 'sum':
          groupAccumulators[alias] = { $sum: `$_${field.field}` }
          break
        case 'avg':
          groupAccumulators[alias] = { $avg: `$_${field.field}` }
          break
        case 'count':
          groupAccumulators[alias] = { $sum: 1 }
          break
        case 'min':
          groupAccumulators[alias] = { $min: `$_${field.field}` }
          break
        case 'max':
          groupAccumulators[alias] = { $max: `$_${field.field}` }
          break
        case 'distinct_count':
          groupAccumulators[alias] = { $addToSet: `$_${field.field}` }
          break
      }
    }
    pipeline.push({
      $group: { _id: null, ...groupAccumulators },
    })
  }

  if (plan.fields && plan.fields.length > 0) {
    const projection: Record<string, unknown> = {}
    for (const field of plan.fields) {
      const alias = field.alias || field.field
      projection[alias] = plan.groupBy?.length
        ? `$_id.${field.field}`
        : `$_${field.field}`
    }
    if (plan.groupBy) {
      for (const gb of plan.groupBy) {
        projection[gb] = `$_id.${gb}`
      }
    }
    if (Object.keys(projection).length > 0) {
      pipeline.push({ $project: { _id: 0, ...projection } })
    }
  }

  if (plan.orderBy && plan.orderBy.length > 0) {
    const sortSpec: Record<string, 1 | -1> = {}
    for (const ob of plan.orderBy) {
      sortSpec[ob.field] = ob.direction === 'asc' ? 1 : -1
    }
    pipeline.push({ $sort: sortSpec })
  }

  pipeline.push({ $limit: plan.limit || 100 })

  return pipeline
}

export function compileQueryPlan(
  plan: QueryPlan
): string | Record<string, unknown>[] {
  if (
    plan.entities.length === 0 &&
    plan.intent !== 'detail'
  ) {
    throw new Error('QueryPlan has no entities specified')
  }

  if (
    plan.sourceType === 'mongodb'
  ) {
    if (plan.entities.length === 0) {
      return []
    }
    return compileToMongoPipeline(plan)
  }

  if (plan.entities.length === 0) {
    return 'SELECT 1 AS placeholder'
  }

  return compileToSql(plan)
}

import { dayIdsInIsoWeek } from './horizonDates.js'

export const BUCKET_FIELD = {
  day: 'dayId',
  week: 'weekId',
  month: 'monthId',
  year: 'yearId',
}

export function bucketKey(kind, id) {
  return `${kind}:${id}`
}

export function parseContainerId(containerId) {
  const m = String(containerId).match(/^(day|week|month|year):(.+)$/)
  if (!m) return null
  return { kind: /** @type {HorizonGrain} */ (m[1]), id: m[2] }
}

/**
 * Tasks in one bucket, ordered by `sortOrder` then creation.
 * @param {object[]} tasks
 * @param {HorizonGrain} kind
 * @param {string} id
 */
export function tasksInBucket(tasks, kind, id) {
  const field = BUCKET_FIELD[kind]
  return tasks
    .filter((t) => t[field] === id)
    .slice()
    .sort((a, b) => {
      const ao = a.sortOrder ?? 0
      const bo = b.sortOrder ?? 0
      if (ao !== bo) return ao - bo
      return String(a.id).localeCompare(String(b.id))
    })
}

/**
 * Tasks for week-column AI insights: tasks on day columns whose dates fall in this ISO week,
 * plus tasks placed on the week bucket itself. Deduplicated by task id.
 * @param {object[]} tasks
 * @param {string} weekId e.g. `2026-W15`
 */
export function tasksForWeekInsight(tasks, weekId) {
  const days = dayIdsInIsoWeek(weekId)
  if (!days.length) {
    return tasksInBucket(tasks, 'week', weekId)
  }
  const daySet = new Set(days)
  const dayIndex = new Map(days.map((d, i) => [d, i]))
  const byId = new Map()
  for (const t of tasks) {
    if (t.dayId && daySet.has(t.dayId)) {
      byId.set(t.id, t)
    }
  }
  for (const t of tasks) {
    if (t.weekId === weekId) {
      byId.set(t.id, t)
    }
  }
  return Array.from(byId.values()).sort((a, b) => {
    const ia = a.dayId != null && dayIndex.has(a.dayId) ? dayIndex.get(a.dayId) : a.dayId != null ? 99 : 100
    const ib = b.dayId != null && dayIndex.has(b.dayId) ? dayIndex.get(b.dayId) : b.dayId != null ? 99 : 100
    if (ia !== ib) return ia - ib
    const ao = a.sortOrder ?? 0
    const bo = b.sortOrder ?? 0
    if (ao !== bo) return ao - bo
    return String(a.id).localeCompare(String(b.id))
  })
}

export function taskContainerId(task) {
  if (task.dayId) return bucketKey('day', task.dayId)
  if (task.weekId) return bucketKey('week', task.weekId)
  if (task.monthId) return bucketKey('month', task.monthId)
  if (task.yearId) return bucketKey('year', task.yearId)
  return null
}

/** Keep only the active bucket field for the given grain. */
export function withBucketGrain(task, kind, bucketId) {
  const field = BUCKET_FIELD[kind]
  const next = { ...task, [field]: bucketId }
  for (const k of Object.values(BUCKET_FIELD)) {
    if (k !== field) delete next[k]
  }
  return next
}

export function inferGrainFromTask(task) {
  if (task.dayId) return 'day'
  if (task.weekId) return 'week'
  if (task.monthId) return 'month'
  if (task.yearId) return 'year'
  return null
}

export function nextSortOrderInBucket(tasks, kind, bucketId) {
  const inB = tasksInBucket(tasks, kind, bucketId)
  if (!inB.length) return 0
  return Math.max(...inB.map((t) => t.sortOrder ?? 0)) + 1
}

export function createTaskInBucket(text, kind, bucketId, tasks) {
  return withBucketGrain(
    {
      id: crypto.randomUUID(),
      text,
      description: '',
      completed: false,
      sortOrder: nextSortOrderInBucket(tasks, kind, bucketId),
    },
    kind,
    bucketId
  )
}

/** Normalize a loaded task so only one bucket field is set (first wins). */
export function normalizeTaskOnLoad(task) {
  const t = { ...task }
  if (t.dayId) {
    delete t.weekId
    delete t.monthId
    delete t.yearId
    return t
  }
  if (t.weekId) {
    delete t.dayId
    delete t.monthId
    delete t.yearId
    return t
  }
  if (t.monthId) {
    delete t.dayId
    delete t.weekId
    delete t.yearId
    return t
  }
  if (t.yearId) {
    delete t.dayId
    delete t.weekId
    delete t.monthId
    return t
  }
  return t
}

/**
 * Migrate v1 `{ days: { YYYY-MM-DD: Task[] } }` to flat `tasks[]`.
 * @param {object} data parsed JSON from storage
 */
/** Reassign `sortOrder` 0..n-1 for tasks in `bucketId` for `kind`, in `orderedIds` order. */
export function mapWithNewOrders(tasks, kind, bucketId, orderedIds) {
  const field = BUCKET_FIELD[kind]
  const orderMap = new Map(orderedIds.map((id, i) => [id, i]))
  return tasks.map((t) => {
    if (t[field] !== bucketId) return t
    const ni = orderMap.get(t.id)
    if (ni === undefined) return t
    return { ...t, sortOrder: ni }
  })
}

export function migrateTasksFromStorage(data) {
  if (Array.isArray(data?.tasks)) {
    return data.tasks.map((t, i) => {
      const n = normalizeTaskOnLoad(t)
      return {
        ...n,
        sortOrder: n.sortOrder ?? i,
        description: n.description ?? '',
        text: n.text ?? '',
        completed: !!n.completed,
      }
    })
  }

  const days = data?.days
  if (days && typeof days === 'object') {
    const out = []
    let order = 0
    for (const [dayId, dayTasks] of Object.entries(days)) {
      if (!Array.isArray(dayTasks)) continue
      for (const t of dayTasks) {
        out.push(
          normalizeTaskOnLoad({
            id: t.id ?? crypto.randomUUID(),
            text: t.text ?? '',
            description: t.description ?? '',
            completed: !!t.completed,
            sortOrder: t.sortOrder ?? order++,
            dayId,
          })
        )
      }
    }
    return out
  }

  return []
}

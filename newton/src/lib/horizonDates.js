/** Local calendar YYYY-MM-DD (not UTC). */
export function localDateToDayId(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayIdToLocalDate(dayId) {
  return new Date(`${dayId}T12:00:00`)
}

export function toLocalMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addLocalDays(d, days) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

/** Monday 00:00 local for the ISO week that contains `d` (local calendar day). */
export function startOfIsoWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const offset = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - offset)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Stable id like `2026-W15` for the ISO week of this local calendar day. */
export function isoWeekIdFromLocalDate(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  const week =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  const y = date.getFullYear()
  return `${y}-W${String(week).padStart(2, '0')}`
}

export function localDateToMonthId(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function localDateToYearId(d) {
  return String(d.getFullYear())
}

export function enumerateDayIds(windowStart, windowEnd) {
  const out = []
  const d = toLocalMidnight(windowStart)
  const end = toLocalMidnight(windowEnd)
  while (d <= end) {
    out.push(localDateToDayId(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export function enumerateWeekIds(windowStart, windowEnd) {
  const out = []
  let d = startOfIsoWeekMonday(windowStart)
  const endT = toLocalMidnight(windowEnd).getTime()
  const seen = new Set()
  while (d.getTime() <= endT) {
    const id = isoWeekIdFromLocalDate(d)
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
    d = addLocalDays(d, 7)
  }
  return out
}

export function enumerateMonthIds(windowStart, windowEnd) {
  const out = []
  const cur = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1)
  const end = toLocalMidnight(windowEnd)
  while (cur <= end) {
    out.push(localDateToMonthId(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return out
}

export function enumerateYearIds(windowStart, windowEnd) {
  const ys = []
  for (let y = windowStart.getFullYear(); y <= windowEnd.getFullYear(); y += 1) {
    ys.push(String(y))
  }
  return ys
}

/**
 * The seven local calendar day ids (Mon→Sun) for an ISO week id `YYYY-Www`.
 * Searches a small date range around the nominal year so week-1 / week-53 edges match `isoWeekIdFromLocalDate`.
 */
export function dayIdsInIsoWeek(weekId) {
  const m = String(weekId).match(/^(\d{4})-W(\d{2})$/)
  if (!m) return []
  const y = Number(m[1])
  let found = null
  const tryRange = (from, to) => {
    let d = toLocalMidnight(from)
    const end = toLocalMidnight(to)
    while (d <= end) {
      if (isoWeekIdFromLocalDate(d) === weekId) {
        found = d
        return true
      }
      d = addLocalDays(d, 1)
    }
    return false
  }
  if (!tryRange(new Date(y, 0, 1), new Date(y, 11, 31))) {
    tryRange(new Date(y - 1, 11, 1), new Date(y + 1, 0, 31))
  }
  if (!found) return []
  const mon = startOfIsoWeekMonday(found)
  const out = []
  for (let i = 0; i < 7; i += 1) {
    out.push(localDateToDayId(addLocalDays(mon, i)))
  }
  return out
}

export function weekIdLabel(weekId) {
  const [y, wRaw] = weekId.split('-W')
  const w = parseInt(wRaw, 10)
  if (!y || Number.isNaN(w)) return weekId
  return `Week ${w}, ${y}`
}

export function monthIdLabel(monthId) {
  const [ys, ms] = monthId.split('-')
  if (!ys || !ms) return monthId
  const d = new Date(Number(ys), Number(ms) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function dayColumnLabel(dayId) {
  const d = dayIdToLocalDate(dayId)
  return {
    title: d.toLocaleDateString('en-US', { weekday: 'long' }),
    subtitle: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

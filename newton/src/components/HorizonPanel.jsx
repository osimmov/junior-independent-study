import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HorizonGrainStrip from './HorizonGrainStrip'
import {
  addLocalDays,
  dayColumnLabel,
  dayIdToLocalDate,
  enumerateDayIds,
  enumerateMonthIds,
  enumerateWeekIds,
  enumerateYearIds,
  isoWeekIdFromLocalDate,
  localDateToDayId,
  localDateToMonthId,
  localDateToYearId,
  monthIdLabel,
  startOfIsoWeekMonday,
  weekIdLabel,
} from '../lib/horizonDates.js'

const WINDOWS_STORAGE_KEY = 'newton-horizon-windows-v1'

const GRAINS = [
  { id: 'day', label: 'Days' },
  { id: 'week', label: 'Weeks' },
  { id: 'month', label: 'Months' },
  { id: 'year', label: 'Years' },
]

function toLocalDate(dayId) {
  return dayIdToLocalDate(dayId)
}

function loadWindows() {
  try {
    const raw = localStorage.getItem(WINDOWS_STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p?.day?.start && p?.day?.end) return p
    }
  } catch {
    // ignore
  }

  const today = new Date()

  const dayStart = addLocalDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), -30)
  const dayEnd = addLocalDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), 30)

  const wkStart = startOfIsoWeekMonday(addLocalDays(today, -84))
  const wkEnd = addLocalDays(today, 84)

  const moStart = new Date(today.getFullYear(), today.getMonth() - 6, 1)
  const moEnd = new Date(today.getFullYear(), today.getMonth() + 18, 0)

  const y = today.getFullYear()
  const yrStart = new Date(y - 2, 0, 1)
  const yrEnd = new Date(y + 2, 11, 31)

  return {
    day: { start: localDateToDayId(dayStart), end: localDateToDayId(dayEnd) },
    week: { start: localDateToDayId(wkStart), end: localDateToDayId(wkEnd) },
    month: { start: localDateToDayId(moStart), end: localDateToDayId(moEnd) },
    year: { start: localDateToDayId(yrStart), end: localDateToDayId(yrEnd) },
  }
}

function saveWindows(w) {
  try {
    localStorage.setItem(WINDOWS_STORAGE_KEY, JSON.stringify(w))
  } catch {
    // ignore
  }
}

function HorizonPanel({
  tasks,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenTask,
  onTasksDragEnd,
}) {
  const [grain, setGrain] = useState('day')
  const [windows, setWindows] = useState(() => loadWindows())
  const scrollRef = useRef(null)

  useEffect(() => {
    saveWindows(windows)
  }, [windows])

  const range = windows[grain]
  const windowStart = useMemo(() => toLocalDate(range.start), [range.start])
  const windowEnd = useMemo(() => toLocalDate(range.end), [range.end])

  const expandLeft = useCallback(() => {
    setWindows((prev) => {
      const r = prev[grain]
      const ws = toLocalDate(r.start)
      const we = toLocalDate(r.end)
      let ns = ws
      let ne = we
      if (grain === 'day') {
        ns = addLocalDays(ws, -14)
      } else if (grain === 'week') {
        ns = addLocalDays(ws, -28)
      } else if (grain === 'month') {
        ns = new Date(ws.getFullYear(), ws.getMonth() - 3, 1)
      } else {
        ns = new Date(ws.getFullYear() - 2, 0, 1)
      }
      return { ...prev, [grain]: { start: localDateToDayId(ns), end: localDateToDayId(ne) } }
    })
  }, [grain])

  const expandRight = useCallback(() => {
    setWindows((prev) => {
      const r = prev[grain]
      const ws = toLocalDate(r.start)
      const we = toLocalDate(r.end)
      let ns = ws
      let ne = we
      if (grain === 'day') {
        ne = addLocalDays(we, 14)
      } else if (grain === 'week') {
        ne = addLocalDays(we, 28)
      } else if (grain === 'month') {
        ne = new Date(we.getFullYear(), we.getMonth() + 4, 0)
      } else {
        ne = new Date(we.getFullYear() + 2, 11, 31)
      }
      return { ...prev, [grain]: { start: localDateToDayId(ns), end: localDateToDayId(ne) } }
    })
  }, [grain])

  const today = new Date()
  const todayDayId = localDateToDayId(today)
  const todayWeekId = isoWeekIdFromLocalDate(today)
  const todayMonthId = localDateToMonthId(today)
  const todayYearId = localDateToYearId(today)

  const columnIds = useMemo(() => {
    if (grain === 'day') return enumerateDayIds(windowStart, windowEnd)
    if (grain === 'week') return enumerateWeekIds(windowStart, windowEnd)
    if (grain === 'month') return enumerateMonthIds(windowStart, windowEnd)
    return enumerateYearIds(windowStart, windowEnd)
  }, [grain, windowStart, windowEnd])

  const columnSpecs = useMemo(() => {
    return columnIds.map((id) => {
      let title = id
      let subtitle = ''
      let isCurrent = false

      if (grain === 'day') {
        const { title: t, subtitle: s } = dayColumnLabel(id)
        title = t
        subtitle = s
        isCurrent = id === todayDayId
      } else if (grain === 'week') {
        title = weekIdLabel(id)
        subtitle = id
        isCurrent = id === todayWeekId
      } else if (grain === 'month') {
        title = monthIdLabel(id)
        subtitle = id
        isCurrent = id === todayMonthId
      } else {
        title = id
        subtitle = 'Year'
        isCurrent = id === todayYearId
      }

      return {
        id,
        title,
        subtitle,
        isCurrent,
        onAddTask: (text) => onAddTask(grain, id, text),
        onToggleTask,
        onEditTask,
        onDeleteTask,
        onOpenTask,
      }
    })
  }, [
    columnIds,
    grain,
    todayDayId,
    todayWeekId,
    todayMonthId,
    todayYearId,
    onAddTask,
    onToggleTask,
    onEditTask,
    onDeleteTask,
    onOpenTask,
  ])

  const leftAnchorKey = columnSpecs[0]?.id

  const jumpLabels = {
    day: 'Today',
    week: 'This week',
    month: 'This month',
    year: 'This year',
  }

  const scrollToCurrent = useCallback(() => {
    const root = scrollRef.current
    const el = root?.querySelector?.('[data-current-bucket]')
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [])

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-newton-border shrink-0">
        {GRAINS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGrain(g.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
              grain === g.id
                ? 'bg-newton-surface text-newton-text border-newton-border'
                : 'border-transparent text-newton-muted hover:text-newton-text hover:bg-white/5'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <HorizonGrainStrip
        key={grain}
        ref={scrollRef}
        grain={grain}
        columnSpecs={columnSpecs}
        tasks={tasks}
        onTasksDragEnd={onTasksDragEnd}
        leftAnchorKey={leftAnchorKey}
        onExpandLeft={expandLeft}
        onExpandRight={expandRight}
      />

      <button
        type="button"
        onClick={scrollToCurrent}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-newton-surface hover:bg-newton-border border border-newton-border text-newton-text rounded-lg text-sm transition-colors z-10"
      >
        {jumpLabels[grain]}
      </button>
    </div>
  )
}

export default HorizonPanel

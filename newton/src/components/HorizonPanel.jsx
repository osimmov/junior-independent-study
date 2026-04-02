import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import DayColumn from './DayColumn'

// Horizon = the main timeline view (infinite horizontal date scrolling).
// - Maintains a finite date window: [windowStart..windowEnd]
// - Expands the window as you scroll near the left/right edges
// - Uses fixed-width columns so we can compensate scroll position when prepending.

const COLUMN_WIDTH = 280 //px (must match DayColumn's fixed width)
const WINDOW_SIZE = 30 //days on each side of today initially
const EXPAND_DAYS = 14 //days to add when the user hits an edge
const EDGE_THRESHOLD = 120 //px from either edge to trigger expansion
const DATE_WINDOW_STORAGE_KEY = 'newton-date-window-v1'

function toLocalMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addLocalDays(d, days) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function localDateToKey(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` // "YYYY-MM-DD"
}

function localKeyToDate(key) {
  // Interpret the saved YYYY-MM-DD as local midnight.
  return new Date(`${key}T00:00:00`)
}

function loadDateWindow() {
  try {
    const raw = localStorage.getItem(DATE_WINDOW_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.start || !parsed?.end) return null
    return { start: parsed.start, end: parsed.end }
  } catch {
    return null
  }
}

function saveDateWindow(start, end) {
  try {
    localStorage.setItem(
      DATE_WINDOW_STORAGE_KEY,
      JSON.stringify({ start: localDateToKey(start), end: localDateToKey(end) })
    )
  } catch {
    // Ignore write errors (e.g. privacy mode).
  }
}

function HorizonPanel({ tasksByDate, onAddTask, onToggleTask, onEditTask, onDeleteTask, onOpenTask }) {
  const containerRef = useRef(null)

  // When we prepend columns on the left, the user's viewport would "jump".
  // We compensate after the DOM updates by adding to scrollLeft.
  const justExpandedLeft = useRef(false)

  // Ensure the "scroll to today" runs only once per mount.
  const didInitialScroll = useRef(false)

  const getInitialWindow = useCallback(() => {
    const today = toLocalMidnight(new Date())
    const saved = loadDateWindow()

    if (saved?.start && saved?.end) {
      const savedStart = localKeyToDate(saved.start)
      const savedEnd = localKeyToDate(saved.end)

      // Sanity check ordering and whether it includes today.
      if (savedStart <= savedEnd && today >= savedStart && today <= savedEnd) {
        return { start: savedStart, end: savedEnd }
      }
    }

    return {
      start: addLocalDays(today, -WINDOW_SIZE),
      end: addLocalDays(today, WINDOW_SIZE),
    }
  }, [])

  const initial = useMemo(() => getInitialWindow(), [getInitialWindow])
  const [windowStart, setWindowStart] = useState(initial.start)
  const [windowEnd, setWindowEnd] = useState(initial.end)

  // Persist the date window whenever it changes (so view switching / remounting keeps it).
  useEffect(() => {
    saveDateWindow(windowStart, windowEnd)
  }, [windowStart, windowEnd])

  // Scroll helper used when the user presses the "Today" button.
  const scrollToToday = useCallback(() => {
    const todayEl = containerRef.current?.querySelector('[data-today]')
    if (todayEl) {
      todayEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  const expandLeft = useCallback(() => {
    justExpandedLeft.current = true
    setWindowStart((prev) => addLocalDays(prev, -EXPAND_DAYS))
  }, [])

  const expandRight = useCallback(() => {
    setWindowEnd((prev) => addLocalDays(prev, EXPAND_DAYS))
  }, [])

  const dates = useMemo(() => {
    const out = []
    const d = new Date(windowStart)
    // Inclusive window: start..end.
    while (d <= windowEnd) {
      out.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return out
  }, [windowStart, windowEnd])

  // After prepending (windowStart changes), compensate scroll position so the viewport stays stable.
  useLayoutEffect(() => {
    if (!justExpandedLeft.current) return
    const el = containerRef.current
    if (!el) return

    el.scrollLeft += EXPAND_DAYS * COLUMN_WIDTH
    justExpandedLeft.current = false
  }, [windowStart])

  // Initial scroll to today (only once).
  useLayoutEffect(() => {
    if (didInitialScroll.current) return
    const el = containerRef.current
    if (!el) return

    const today = toLocalMidnight(new Date())
    const todayIndex = dates.findIndex((d) => localDateToKey(d) === localDateToKey(today))
    if (todayIndex < 0) return

    // Center the "today" column when possible.
    const centerOffset = el.clientWidth / 2 - COLUMN_WIDTH / 2
    el.scrollLeft = Math.max(0, todayIndex * COLUMN_WIDTH - centerOffset)
    didInitialScroll.current = true
  }, [dates])

  // Edge-trigger expansion on scroll.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return

      const hitLeft = el.scrollLeft < EDGE_THRESHOLD
      const hitRight = el.scrollLeft > maxScroll - EDGE_THRESHOLD

      if (hitLeft) expandLeft()
      else if (hitRight) expandRight()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [expandLeft, expandRight])

  const todayStr = new Date().toDateString()

  return (
    <>
      {/* Horizontally scrollable row of fixed-width day columns */}
      <div
        ref={containerRef}
        className="flex flex-1 overflow-x-scroll overflow-y-hidden min-h-0 min-w-0"
      >
        {dates.map((date) => {
          const dateKey = date.toISOString().slice(0, 10)
          const isToday = date.toDateString() === todayStr

          return (
            <DayColumn
              key={dateKey}
              dateKey={dateKey}
              date={date}
              columnWidth={COLUMN_WIDTH}
              tasks={tasksByDate[dateKey] ?? []}
              isToday={isToday}
              onAddTask={onAddTask}
              onToggleTask={(taskId) => onToggleTask(dateKey, taskId)}
              onEditTask={(taskId, text, oldText) => onEditTask(dateKey, taskId, text, oldText)}
              onDeleteTask={(taskId) => onDeleteTask(dateKey, taskId)}
              onOpenTask={(taskId) => onOpenTask(dateKey, taskId)}
            />
          )
        })}
      </div>

      {/* Today button to scroll to today's column */}
      <button
        type="button"
        onClick={scrollToToday}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors z-10"
      >
        Today
      </button>
    </>
  )
}

export default HorizonPanel
import { useRef, useEffect, useCallback } from 'react'
import DayColumn from './DayColumn'

// Horizon = the main timeline view.
// - Renders one DayColumn per date in the range
// - Auto-centers today's column on mount
// - Provides a fixed "Today" button to jump back after scrolling
function HorizonPanel({ dates, tasksByDate, onAddTask, onToggleTask, onEditTask, onDeleteTask, onOpenTask }) {
  const todayStr = new Date().toDateString()
  const scrollRef = useRef(null)

  // Scroll helper used both on mount and when the user presses the "Today" button.
  const scrollToToday = useCallback(() => {
    const todayEl = scrollRef.current?.querySelector('[data-today]') //todayEl becomes either:
                                                                        // the DOM element for today’s block, or
                                                                        // undefined if it can’t be found.
    if (todayEl) {
      todayEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  // On first render, center today's block so the user starts at the most relevant date.
  useEffect(() => {
    scrollToToday()
  }, [scrollToToday])

  return (
    <>
    {/* Horizontally scrollable row of day columns */}
    <div ref={scrollRef} className="flex flex-1 overflow-x-auto min-h-0">
      {dates.map((date) => {
        const dateKey = date.toISOString().slice(0, 10)
        const isToday = date.toDateString() === todayStr
        return (
          <DayColumn // Passes the task id to the DayColumn component
            key={dateKey}
            dateKey={dateKey}
            date={date}
            tasks={tasksByDate[dateKey] ?? []}
            isToday={isToday}
            onAddTask={onAddTask}
            onToggleTask={(taskId) => onToggleTask(dateKey, taskId)}
            onEditTask={(taskId, text, oldText) => onEditTask(dateKey, taskId, text, oldText)}
            onDeleteTask={(taskId) => onDeleteTask(dateKey, taskId)}
            onOpenTask={(taskId) => onOpenTask(dateKey, taskId)}//Opens the task modal
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
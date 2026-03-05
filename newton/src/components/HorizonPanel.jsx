import { useRef, useEffect, useCallback } from 'react'
import DayColumn from './DayColumn'

function HorizonPanel({ dates, tasksByDate, onAddTask, onToggleTask, onEditTask, onDeleteTask }) {
  const todayStr = new Date().toDateString()
  const scrollRef = useRef(null)

  const scrollToToday = useCallback(() => {
    const todayEl = scrollRef.current?.querySelector('[data-today]')
    if (todayEl) {
      todayEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToToday()
  }, [scrollToToday])

  return (
    <>
    <div ref={scrollRef} className="flex flex-1 overflow-x-auto min-h-0">
      {dates.map((date) => {
        const dateKey = date.toISOString().slice(0, 10)
        const isToday = date.toDateString() === todayStr
        return (
          <DayColumn
            key={dateKey}
            dateKey={dateKey}
            date={date}
            tasks={tasksByDate[dateKey] ?? []}
            isToday={isToday}
            onAddTask={onAddTask}
            onToggleTask={(taskId) => onToggleTask(dateKey, taskId)}
            onEditTask={(taskId, text, oldText) => onEditTask(dateKey, taskId, text, oldText)}
            onDeleteTask={(taskId) => onDeleteTask(dateKey, taskId)}
          />
        )
      })}
    </div>

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

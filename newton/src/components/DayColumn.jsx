import { useState } from 'react'
import TaskItem from './TaskItem'

function DayColumn({ dateKey, date, tasks, isToday, onAddTask, onToggleTask, onEditTask, onDeleteTask }) {
  const [inputValue, setInputValue] = useState('')

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const handleAdd = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddTask(dateKey, inputValue.trim())
      setInputValue('')
    }
  }

  const headerClass = isToday ? 'text-orange-500' : 'text-gray-400'

  return (
    <div
      className="flex flex-col flex-1 min-w-[200px] max-w-[260px] border-r border-gray-800"
      {...(isToday && { 'data-today': '' })}
    >
      {/* Header: Day + Date */}
      <div className="px-4 pt-4 pb-2">
        <h2 className={`text-base font-medium ${headerClass}`}>
          <span className="block">{dayName}</span>
          <span className="block text-sm font-normal opacity-90">{dateStr}</span>
        </h2>
      </div>

      {/* Task list with Add input right below last task */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-[80px]">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
        <div className="pt-2">
          <input
            type="text"
            placeholder="Add..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleAdd}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
          />
        </div>
      </div>
    </div>
  )
}

export default DayColumn

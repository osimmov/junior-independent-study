import { useState } from 'react'

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)

  const handleSaveEdit = () => {
    if (editText.trim()) {
      if (editText.trim() !== task.text) {
        onEdit(task.id, editText.trim(), task.text)
      }
      setIsEditing(false)
      setShowMenu(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') {
      setEditText(task.text)
      setIsEditing(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="group flex items-start gap-2 py-2 rounded hover:bg-white/5 transition-colors">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="mt-1.5 w-4 h-4 rounded border-gray-600 bg-transparent text-gray-500 cursor-pointer flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        ) : (
          <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
            {task.text}
          </span>
        )}
      </div>
      {/* Option button - on the RIGHT, shows on hover */}
      <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300"
          aria-label="Options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} aria-hidden="true" />
            <div className="absolute right-0 top-full mt-1 z-20 py-1 w-28 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <button
                type="button"
                onClick={() => { setEditText(task.text); setIsEditing(true); setShowMenu(false) }}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => { onDelete(task.id); setShowMenu(false) }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TaskItem

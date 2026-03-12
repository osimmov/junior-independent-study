import { useState } from 'react'

// Renders a single task row:
// - checkbox to complete
// - text (or inline edit input)
// - hover-only options menu (Edit/Delete)
function TaskItem({ task, onToggle, onEdit, onDelete, onOpen }) { //Props passed from DayColumn
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)

  // Saves edits and closes the editing/menu UI.
  // We only call `onEdit` when the text actually changed.
  const handleSaveEdit = () => {
    if (editText.trim()) {
      if (editText.trim() !== task.text) {
        onEdit(task.id, editText.trim(), task.text)
      }
      setIsEditing(false)
      setShowMenu(false)
    }
  }

  // Keyboard shortcuts:
  // - Enter saves
  // - Escape cancels and restores original text
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') {
      setEditText(task.text)
      setIsEditing(false)
      setShowMenu(false)
    }
  }

  const hasDescription = Boolean(task.description && task.description.trim())

  return (
    // Entire row opens the modal (except checkbox and options, which stop propagation).
    <div
      className="group flex items-start gap-2 py-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
      role="button"
      tabIndex={isEditing ? -1 : 0}
      onClick={() => {
        if (!isEditing) onOpen()
      }}
      onKeyDown={(e) => {
        // Keyboard: Enter opens the modal when the row is focused.
        if (e.key === 'Enter' && e.target === e.currentTarget && !isEditing) {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {/* Completion toggle (must NOT open the modal) */}
      <input
        type="checkbox"
        checked={task.completed}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggle(task.id)}
        className="mt-1.5 w-4 h-4 rounded border-gray-600 bg-transparent text-gray-500 cursor-pointer flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          // Inline edit field
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
          // Normal display state (row click/Enter opens the modal)
          <div className={`inline-flex items-center gap-2 text-sm ${
            task.completed ? 'line-through text-gray-500' : 'text-gray-300'
          }`}>
            <span>{task.text}</span>
            {/* If a task has a non-empty description, show a small indicator icon. */}
            {hasDescription && (
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="Has description"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                />
              </svg>
            )}
          </div>
        )}
      </div>
      {/* Option button - on the RIGHT, shows on hover */}
      <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            // Options menu must NOT open the modal.
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300"
          aria-label="Options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        {showMenu && (
          <>
            {/* Click-away overlay to close the menu when clicking outside. */}
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} aria-hidden="true" />
            {/* Small dropdown menu positioned next to the options button. */}
            <div className="absolute right-0 top-full mt-1 z-20 py-1 w-28 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditText(task.text)
                  setIsEditing(true)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                  setShowMenu(false)
                }}
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

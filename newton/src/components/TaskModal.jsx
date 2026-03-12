import { useEffect, useMemo, useRef, useState } from 'react'

// TaskModal shows editable task details (title + description).
// It is "save-on-close": closing via Escape/outside click/X saves any edits first.
function TaskModal({ task, onSave, onRequestClose }) {
  // Local editable fields for the task's title and description.
  const [title, setTitle] = useState(task.text)
  const [description, setDescription] = useState(task.description ?? '')

  // Snapshot of the task when the modal opened, used to detect real changes.
  const initial = useMemo(
    () => ({ text: task.text, description: task.description ?? '' }),
    [task.text, task.description]
  )

  // Ref to the dialog container (for focus management or future DOM work).
  const dialogRef = useRef(null)

  // Keep local draft state in sync if the modal is opened for a different task.
  useEffect(() => {
    setTitle(task.text)
    setDescription(task.description ?? '')
  }, [task.id, task.text, task.description])

  // Close on Escape (and save first).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeAndSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, initial])

  // Decide whether we need to save anything before closing.
  const maybeSave = () => {
    // Use the trimmed title if it's non-empty; otherwise fall back to the original.
    const nextTitle = title.trim() ? title.trim() : initial.text
    const nextDescription = description

    // Check if either the title or description actually changed.
    const titleChanged = nextTitle !== initial.text
    const descriptionChanged = nextDescription !== initial.description

    // If nothing changed, do nothing.
    if (!titleChanged && !descriptionChanged) return

    // Notify the parent about the updated values, including the old title for logging.
    onSave({ text: nextTitle, description: nextDescription }, { oldText: initial.text })
  }

  // Helper that saves any changes (if needed) and then closes the modal.
  const closeAndSave = () => {
    maybeSave()
    onRequestClose()
  }

  // Title rule: no empty titles. If the user clears it and blurs, revert.
  const handleTitleBlur = () => {
    if (!title.trim()) {
      setTitle(initial.text)
      return
    }
    // Save title changes on blur (but avoid duplicate saves).
    if (title.trim() !== initial.text) {
      onSave({ text: title.trim() }, { oldText: initial.text })
    }
  }

  // Description saves on blur (also avoids duplicates).
  const handleDescriptionBlur = () => {
    if (description !== initial.description) {
      onSave({ description }, { oldText: initial.text })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        // Outside click closes (save-on-close). Clicking inside should not close.
        if (e.target === e.currentTarget) closeAndSave()
      }}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#1A1A1A] shadow-2xl"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-200">Task</h2>
          <button
            type="button"
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200"
            onClick={closeAndSave}
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full bg-gray-800/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={6}
              className="w-full resize-none bg-gray-800/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-600"
              placeholder="Add a description..."
            />
          </div>

        </div>
      </div>
    </div>
  )
}

export default TaskModal


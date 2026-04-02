import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import HorizonPanel from './components/HorizonPanel'
import ProgressPanel from './components/ProgressPanel'
import AIInsightsPanel from './components/AIInsightsPanel'
import TaskModal from './components/TaskModal'
import './App.css'

// Single localStorage key used to persist the app state in the browser.
const STORAGE_KEY = 'newton-data'

// Builds the list of day "columns" shown in Horizon.
// Right now it's a fixed range (Feb 5 -> Mar 15 of the current year).
function getDateRange() { //creates an array of dates from Feb 5 to May 31 of the current year.
  const year = new Date().getFullYear()
  const start = new Date(year, 0, 5)   // Feb 5(1 is February, 5 is the day)
  const end = new Date(year, 4, 31)    // May 31 (4 is May)

  const dates = []
  const d = new Date(start)
  while (d <= end) {
    dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// Converts a Date object into a stable string key like "2026-02-25".
// We use this as the dictionary key for tasks-per-day.
function dateToKey(date) {
  return date.toISOString().slice(0, 10)
}

// Reads tasks from localStorage and returns a dictionary:
// { "YYYY-MM-DD": [task, task, ...], ... }
// If a day doesn't exist in storage yet, we default it to an empty array.
function loadTasks(dates) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) 
      return null; //If there’s no saved data, return null.
    const data = JSON.parse(saved)
    const days = data.days ?? {}
    const result = {}
    dates.forEach((d) => {
      const key = dateToKey(d)
      result[key] = days[key] ?? []
    })
    return result
  } catch {
    return null
  }
}

// Reads the progress/activity log from localStorage.
function loadActivities() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const data = JSON.parse(saved)
    return data.activities ?? null
  } catch {
    return null
  }
}

// Persists tasks + activity log to localStorage.
// We merge tasksByDate into any existing stored "days" so previously saved
// dates don't get wiped out if they're not currently rendered.
function saveToStorage(tasksByDate, activities) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const data = saved ? JSON.parse(saved) : { days: {}, activities: [] }
    data.days = data.days ?? {}
    Object.assign(data.days, tasksByDate)
    data.activities = activities
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

// Creates a single task object.
function createTask(text) {
  return {
    id: crypto.randomUUID(),
    text,
    description: '',
    completed: false,
  }
}

function addActivity(activities, type, taskName) {
  const now = new Date()
  // Use the user's local calendar date (YYYY-MM-DD) instead of UTC,
  // so activity entries appear under the expected "today" in ProgressPanel.
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const date = `${year}-${month}-${day}`
  const time = now.toTimeString().slice(0, 5)
  return [
    { id: crypto.randomUUID(), date, time, type, taskName },
    ...activities,
  ]
}

function App() {
  // Which panel is visible (controlled by the sidebar).
  const [activePanel, setActivePanel] = useState('horizon')

  // Horizon's date columns. Stored once so it doesn't rebuild on every render.
  const [dates] = useState(getDateRange)

  // Tasks are stored as a dictionary keyed by date (YYYY-MM-DD).
  const [tasksByDate, setTasksByDate] = useState(() => {
    const loaded = loadTasks(dates)
    return loaded ?? {}
  })

  // Activity history shown in the Progress panel.
  const [activities, setActivities] = useState(() => {
    const loaded = loadActivities()
    return loaded ?? []
  })

  // When set, the TaskModal is visible for a specific task (identified by dateKey + taskId).
  const [modalTaskRef, setModalTaskRef] = useState(null)

  // Save whenever tasks or activities change.
  useEffect(() => {
    saveToStorage(tasksByDate, activities)
  }, [tasksByDate, activities])

  //Adding a task to a certain day
  // Adds a task to a specific date.
  const handleAddTask = useCallback((dateKey, text) => {
    setTasksByDate((prev) => {
      const dayTasks = prev[dateKey] ?? []
      return { ...prev, [dateKey]: [...dayTasks, createTask(text)] }
    })
    setActivities((prev) => addActivity(prev, 'created', text))
  }, [])

  // Toggles a task complete/incomplete.
  // We log an activity only when a task becomes completed (not when unchecking).
  const handleToggleTask = useCallback((dateKey, taskId) => {
    const dayTasks = tasksByDate[dateKey] ?? []
    const task = dayTasks.find((t) => t.id === taskId)
    const taskName = task?.text ?? ''
    const wasCompleted = task?.completed ?? false

    setTasksByDate((prev) => {
      const dayTasks = prev[dateKey] ?? []
      return {
        ...prev,
        [dateKey]: dayTasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ),
      }
    })
    if (taskName && !wasCompleted) {
      setActivities((prev) => addActivity(prev, 'completed', taskName))
    }
  }, [tasksByDate])

  // Updates a task's text.
  // The Progress log uses oldText (when available) so you can see what was renamed.
  const handleEditTask = useCallback((dateKey, taskId, newText, oldText) => {
    setTasksByDate((prev) => {
      const dayTasks = prev[dateKey] ?? []
      return {
        ...prev,
        [dateKey]: dayTasks.map((t) =>
          t.id === taskId ? { ...t, text: newText } : t
        ),
      }
    })
    setActivities((prev) => addActivity(prev, 'edited', oldText || newText))
  }, [])

  // Deletes a task from a given date.
  const handleDeleteTask = useCallback((dateKey, taskId) => {
    const dayTasks = tasksByDate[dateKey] ?? []
    const task = dayTasks.find((t) => t.id === taskId)
    const taskName = task?.text ?? ''

    setTasksByDate((prev) => {
      const dayTasks = prev[dateKey] ?? []
      return { ...prev, [dateKey]: dayTasks.filter((t) => t.id !== taskId) }
    })
    if (taskName) {
      setActivities((prev) => addActivity(prev, 'deleted', taskName))
    }
  }, [tasksByDate])

  // Opens the modal for a particular task.
  const openTaskModal = useCallback((dateKey, taskId) => {
    setModalTaskRef({ dateKey, taskId })
  }, [])

  // Closes the modal (saving is handled by the modal before it calls this).
  const closeTaskModal = useCallback(() => {
    setModalTaskRef(null)
  }, [])

  // Applies a partial update to a task (title and/or description) and logs a single edit activity.
  const handleModalSave = useCallback((dateKey, taskId, patch, meta) => {
    const dayTasks = tasksByDate[dateKey] ?? []
    const task = dayTasks.find((t) => t.id === taskId)
    if (!task) return

    const nextText = patch.text ?? task.text
    const nextDescription = patch.description ?? (task.description ?? '')

    const textChanged = nextText !== task.text
    const descriptionChanged = nextDescription !== (task.description ?? '')
    if (!textChanged && !descriptionChanged) return

    setTasksByDate((prev) => {
      const dayTasks = prev[dateKey] ?? []
      return {
        ...prev,
        [dateKey]: dayTasks.map((t) =>
          t.id === taskId ? { ...t, ...patch } : t
        ),
      }
    })
    setActivities((prev) => addActivity(prev, 'edited', meta?.oldText || task.text))
  }, [tasksByDate])

  // Resolve the currently open modal task from state.
  const modalTask = (() => {
    if (!modalTaskRef) return null
    const dayTasks = tasksByDate[modalTaskRef.dateKey] ?? []
    return dayTasks.find((t) => t.id === modalTaskRef.taskId) ?? null
  })()

  return (
    // App "shell": sidebar on the left, active panel on the right.
    <div className="flex h-screen text-gray-300" style={{ backgroundColor: '#1A1A1A' }}>
      <Sidebar activePanel={activePanel} onSelect={setActivePanel} />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Horizon: main task timeline view */}
        {activePanel === 'horizon' && (
          <HorizonPanel
            dates={dates}
            tasksByDate={tasksByDate}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onOpenTask={openTaskModal}
          />
        )}
        {/* Progress: activity log */}
        {activePanel === 'progress' && <ProgressPanel activities={activities} />}
        {/* AI Insights: UI-only panel for now */}
        {activePanel === 'insights' && <AIInsightsPanel />}
      </main>

      {/* Task details modal (only shown when a task is selected). */}
      {modalTaskRef && modalTask && (
        <TaskModal
          task={modalTask}
          onSave={(patch, meta) => handleModalSave(modalTaskRef.dateKey, modalTaskRef.taskId, patch, meta)}
          onRequestClose={closeTaskModal}
        />
      )}
    </div>
  )
}

export default App

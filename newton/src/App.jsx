import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import HorizonPanel from './components/HorizonPanel'
import ProgressPanel from './components/ProgressPanel'
import AIInsightsPanel from './components/AIInsightsPanel'
import './App.css'

const STORAGE_KEY = 'newton-data'

function getDateRange() {
  const year = new Date().getFullYear()
  const start = new Date(year, 1, 5)   // Feb 5(1 is February, 5 is the day)
  const end = new Date(year, 2, 15)    // Mar 15 (2 is March)

  const dates = []
  const d = new Date(start)
  while (d <= end) {
    dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function dateToKey(date) {
  return date.toISOString().slice(0, 10)
}

function loadTasks(dates) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
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

function createTask(text) {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
  }
}

function addActivity(activities, type, taskName) {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  return [
    { id: crypto.randomUUID(), date, time, type, taskName },
    ...activities,
  ]
}

function App() {
  const [activePanel, setActivePanel] = useState('horizon')
  const [dates] = useState(getDateRange)

  const [tasksByDate, setTasksByDate] = useState(() => {
    const loaded = loadTasks(dates)
    return loaded ?? {}
  })
  const [activities, setActivities] = useState(() => {
    const loaded = loadActivities()
    return loaded ?? []
  })

  useEffect(() => {
    saveToStorage(tasksByDate, activities)
  }, [tasksByDate, activities])

  const handleAddTask = useCallback((dateKey, text) => {
    setTasksByDate((prev) => {
      const dayTasks = prev[dateKey] ?? []
      return { ...prev, [dateKey]: [...dayTasks, createTask(text)] }
    })
    setActivities((prev) => addActivity(prev, 'created', text))
  }, [])

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

  return (
    <div className="flex h-screen text-gray-300" style={{ backgroundColor: '#1A1A1A' }}>
      <Sidebar activePanel={activePanel} onSelect={setActivePanel} />
      <main className="flex-1 flex flex-col min-w-0">
        {activePanel === 'horizon' && (
          <HorizonPanel
            dates={dates}
            tasksByDate={tasksByDate}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {activePanel === 'progress' && <ProgressPanel activities={activities} />}
        {activePanel === 'insights' && <AIInsightsPanel />}
      </main>
    </div>
  )
}

export default App

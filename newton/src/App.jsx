import { useCallback, useEffect, useRef, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import Sidebar from './components/Sidebar'
import HorizonPanel from './components/HorizonPanel'
import ProgressPanel from './components/ProgressPanel'
import AIInsightsPanel from './components/AIInsightsPanel'
import TaskModal from './components/TaskModal'
import { BucketInsightsProvider } from './contexts/BucketInsightsContext.jsx'
import { sendProductivityChatMessage } from './services/ollamaReflections'
import {
  createTaskInBucket,
  mapWithNewOrders,
  migrateTasksFromStorage,
  parseContainerId,
  taskContainerId,
  tasksInBucket,
  withBucketGrain,
} from './lib/tasks.js'
import './App.css'

const STORAGE_KEY = 'newton-data'

function loadAppData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { tasks: [], activities: [] }
    const data = JSON.parse(saved)
    const tasks = migrateTasksFromStorage(data).filter((t) => taskContainerId(t))
    return {
      tasks,
      activities: Array.isArray(data.activities) ? data.activities : [],
    }
  } catch {
    return { tasks: [], activities: [] }
  }
}

function saveAppData(tasks, activities) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, tasks, activities }))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

function addActivity(activities, type, taskName) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const date = `${year}-${month}-${day}`
  const time = now.toTimeString().slice(0, 5)
  return [{ id: crypto.randomUUID(), date, time, type, taskName }, ...activities]
}

function App() {
  const initial = loadAppData()
  const [activePanel, setActivePanel] = useState('horizon')
  const [tasks, setTasks] = useState(initial.tasks)
  const [activities, setActivities] = useState(initial.activities)
  const [modalTaskId, setModalTaskId] = useState(null)

  const [insightMessages, setInsightMessages] = useState([])
  const [insightError, setInsightError] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const insightRequestId = useRef(0)

  useEffect(() => {
    saveAppData(tasks, activities)
  }, [tasks, activities])

  const handleSendInsightMessage = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const userMsg = { id: crypto.randomUUID(), role: 'user', content: trimmed }
      const requestId = ++insightRequestId.current
      setInsightError(null)

      let snapshotForApi
      setInsightMessages((prev) => {
        snapshotForApi = [...prev, userMsg].map(({ role, content }) => ({ role, content }))
        return [...prev, userMsg]
      })

      setInsightLoading(true)
      try {
        const reply = await sendProductivityChatMessage(activities, snapshotForApi)
        if (requestId !== insightRequestId.current) return
        setInsightMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: reply },
        ])
      } catch (e) {
        if (requestId !== insightRequestId.current) return
        setInsightError(e?.message ?? 'Something went wrong.')
      } finally {
        if (requestId === insightRequestId.current) {
          setInsightLoading(false)
        }
      }
    },
    [activities]
  )

  const handleAddTask = useCallback((grain, bucketId, text) => {
    setTasks((prev) => [...prev, createTaskInBucket(text, grain, bucketId, prev)])
    setActivities((prev) => addActivity(prev, 'created', text))
  }, [])

  const handleToggleTask = useCallback((taskId) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId)
      if (!task) return prev
      const wasCompleted = task.completed
      const taskName = task.text ?? ''
      if (taskName && !wasCompleted) {
        setActivities((a) => addActivity(a, 'completed', taskName))
      }
      return prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    })
  }, [])

  const handleEditTask = useCallback((taskId, newText, oldText) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, text: newText } : t)))
    setActivities((prev) => addActivity(prev, 'edited', oldText || newText))
  }, [])

  const handleDeleteTask = useCallback((taskId) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId)
      const taskName = task?.text ?? ''
      if (taskName) {
        setActivities((a) => addActivity(a, 'deleted', taskName))
      }
      return prev.filter((t) => t.id !== taskId)
    })
  }, [])

  const openTaskModal = useCallback((taskId) => {
    setModalTaskId(taskId)
  }, [])

  const closeTaskModal = useCallback(() => {
    setModalTaskId(null)
  }, [])

  const handleModalSave = useCallback((taskId, patch, meta) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId)
      if (!task) return prev
      const nextText = patch.text ?? task.text
      const nextDescription = patch.description ?? (task.description ?? '')
      const textChanged = nextText !== task.text
      const descriptionChanged = nextDescription !== (task.description ?? '')
      if (!textChanged && !descriptionChanged) return prev
      setActivities((a) => addActivity(a, 'edited', meta?.oldText || task.text))
      return prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    })
  }, [])

  const handleHorizonDragEnd = useCallback((grain, event) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    setTasks((tasksBefore) => {
      const activeTask = tasksBefore.find((t) => t.id === activeId)
      if (!activeTask) return tasksBefore

      const source = taskContainerId(activeTask)
      if (!source || !source.startsWith(`${grain}:`)) return tasksBefore

      const overIsContainer = /^(day|week|month|year):/.test(overId)

      let targetContainer
      if (overIsContainer) {
        const parsed = parseContainerId(overId)
        if (!parsed || parsed.kind !== grain) return tasksBefore
        targetContainer = overId
      } else {
        const overTask = tasksBefore.find((t) => t.id === overId)
        if (!overTask) return tasksBefore
        targetContainer = taskContainerId(overTask)
        if (!targetContainer || !targetContainer.startsWith(`${grain}:`)) return tasksBefore
      }

      const parsedSource = parseContainerId(source)
      const parsedTarget = parseContainerId(targetContainer)
      if (!parsedSource || !parsedTarget) return tasksBefore

      if (source === targetContainer) {
        const orderedIds = tasksInBucket(tasksBefore, grain, parsedSource.id).map((t) => t.id)
        const oldIndex = orderedIds.indexOf(activeId)
        let newIndex
        if (overIsContainer && overId === source) {
          newIndex = orderedIds.length - 1
        } else if (!overIsContainer) {
          newIndex = orderedIds.indexOf(overId)
        } else {
          return tasksBefore
        }
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return tasksBefore
        const newOrder = arrayMove(orderedIds, oldIndex, newIndex)
        return mapWithNewOrders(tasksBefore, grain, parsedSource.id, newOrder)
      }

      const targetBucketId = parsedTarget.id
      const targetBefore = tasksInBucket(tasksBefore, grain, targetBucketId).map((t) => t.id)

      let insertIndex
      if (overIsContainer) {
        insertIndex = targetBefore.length
      } else {
        insertIndex = targetBefore.indexOf(overId)
        if (insertIndex < 0) insertIndex = targetBefore.length
      }

      const sourceBucketId = parsedSource.id
      const at = tasksBefore.find((t) => t.id === activeId)
      if (!at) return tasksBefore

      let next = tasksBefore.map((t) =>
        t.id === activeId ? withBucketGrain(at, grain, targetBucketId) : t
      )

      const targetIds = tasksInBucket(next, grain, targetBucketId)
        .map((t) => t.id)
        .filter((id) => id !== activeId)
      const idx = Math.min(Math.max(0, insertIndex), targetIds.length)
      const newTargetOrder = [...targetIds.slice(0, idx), activeId, ...targetIds.slice(idx)]
      next = mapWithNewOrders(next, grain, targetBucketId, newTargetOrder)

      if (sourceBucketId !== targetBucketId) {
        const sourceIds = tasksInBucket(next, grain, sourceBucketId).map((t) => t.id)
        next = mapWithNewOrders(next, grain, sourceBucketId, sourceIds)
      }

      return next
    })
  }, [])

  const modalTask = modalTaskId ? tasks.find((t) => t.id === modalTaskId) ?? null : null

  return (
    <BucketInsightsProvider tasks={tasks}>
      <div className="flex h-screen bg-newton-charcoal text-newton-text">
        <Sidebar activePanel={activePanel} onSelect={setActivePanel} />
        <main className="flex-1 flex flex-col min-w-0">
          {activePanel === 'horizon' && (
            <HorizonPanel
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onOpenTask={openTaskModal}
              onTasksDragEnd={handleHorizonDragEnd}
            />
          )}
          {activePanel === 'progress' && <ProgressPanel activities={activities} />}
          {activePanel === 'insights' && (
            <AIInsightsPanel
              messages={insightMessages}
              error={insightError}
              loading={insightLoading}
              onSendMessage={handleSendInsightMessage}
            />
          )}
        </main>

        {modalTaskId && modalTask && (
          <TaskModal
            task={modalTask}
            onSave={(patch, meta) => handleModalSave(modalTaskId, patch, meta)}
            onRequestClose={closeTaskModal}
          />
        )}
      </div>
    </BucketInsightsProvider>
  )
}

export default App

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DEFAULT_BUCKET_INSIGHT_PROMPTS } from '../config/bucketInsightPrompts.js'
import {
  buildBucketInsightUserMessage,
  fetchBucketInsightChat,
} from '../services/ollamaBucketInsights.js'
import { OLLAMA_INSIGHTS_MODEL } from '../config/ollama.js'
import { bucketKey, tasksForWeekInsight, tasksInBucket } from '../lib/tasks.js'
import BucketInsightsModal from '../components/BucketInsightsModal.jsx'

const CACHE_STORAGE_KEY = 'newton-bucket-insight-cache-v1'
const PROMPTS_STORAGE_KEY = 'newton-bucket-insight-prompts-v1'

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const BucketInsightsContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useBucketInsights() {
  const ctx = useContext(BucketInsightsContext)
  if (!ctx) {
    throw new Error('useBucketInsights must be used within BucketInsightsProvider')
  }
  return ctx
}

/**
 * @param {{ children: import('react').ReactNode, tasks: object[] }} props
 */
export function BucketInsightsProvider({ children, tasks }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKind, setModalKind] = useState('day')
  const [modalId, setModalId] = useState('')
  const [modalLabel, setModalLabel] = useState('')

  const [cache, setCache] = useState(() => loadJson(CACHE_STORAGE_KEY, {}))
  const [customPrompts, setCustomPrompts] = useState(() =>
    loadJson(PROMPTS_STORAGE_KEY, {})
  )

  const [error, setError] = useState(null)
  const [lastModel, setLastModel] = useState(OLLAMA_INSIGHTS_MODEL)
  const genSeqByKeyRef = useRef({})
  const [insightPendingByKey, setInsightPendingByKey] = useState(() => ({}))

  const currentKey = modalOpen ? bucketKey(modalKind, modalId) : null

  const mergeInsightIntoCache = useCallback((key, text) => {
    setCache((prev) => {
      const next = { ...prev, [key]: text }
      saveJson(CACHE_STORAGE_KEY, next)
      return next
    })
  }, [])

  const persistPrompts = useCallback((next) => {
    setCustomPrompts(next)
    saveJson(PROMPTS_STORAGE_KEY, next)
  }, [])

  const openModal = useCallback((kind, id, label) => {
    setModalKind(kind)
    setModalId(id)
    setModalLabel(label)
    setModalOpen(true)
    setError(null)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const systemForGrain = useCallback(
    (kind) => {
      const custom = customPrompts?.[kind]
      if (typeof custom === 'string' && custom.trim()) return custom.trim()
      return DEFAULT_BUCKET_INSIGHT_PROMPTS[kind] ?? DEFAULT_BUCKET_INSIGHT_PROMPTS.day
    },
    [customPrompts]
  )

  const splitForModal = useMemo(() => {
    if (!modalOpen) return { completed: [], incomplete: [] }
    const bucketTasks =
      modalKind === 'week'
        ? tasksForWeekInsight(tasks, modalId)
        : tasksInBucket(tasks, modalKind, modalId)
    const completed = bucketTasks.filter((t) => t.completed)
    const incomplete = bucketTasks.filter((t) => !t.completed)
    return { completed, incomplete }
  }, [tasks, modalOpen, modalKind, modalId])

  const canCallLlm = splitForModal.completed.length > 0

  const runGenerate = useCallback(async () => {
    const key = bucketKey(modalKind, modalId)
    if (!modalId) return

    const bucketTasks =
      modalKind === 'week'
        ? tasksForWeekInsight(tasks, modalId)
        : tasksInBucket(tasks, modalKind, modalId)
    const completed = bucketTasks.filter((t) => t.completed)
    const incomplete = bucketTasks.filter((t) => !t.completed)
    const split = { completed, incomplete }

    if (completed.length === 0) {
      setError(null)
      return
    }

    const seqMap = genSeqByKeyRef.current
    seqMap[key] = (seqMap[key] || 0) + 1
    const seq = seqMap[key]

    setInsightPendingByKey((p) => ({ ...p, [key]: true }))
    setError(null)

    try {
      const system = systemForGrain(modalKind)
      const user = buildBucketInsightUserMessage(modalKind, modalId, modalLabel, split)
      const { text, model } = await fetchBucketInsightChat(system, user)
      if (seqMap[key] !== seq) return
      setLastModel(model)
      mergeInsightIntoCache(key, text)
    } catch (e) {
      if (seqMap[key] !== seq) return
      setError(e?.message ?? 'Something went wrong.')
      setLastModel(OLLAMA_INSIGHTS_MODEL)
    } finally {
      if (seqMap[key] === seq) {
        setInsightPendingByKey((p) => {
          const next = { ...p }
          delete next[key]
          return next
        })
      }
    }
  }, [modalKind, modalId, modalLabel, tasks, systemForGrain, mergeInsightIntoCache])

  const savePromptForGrain = useCallback(
    (kind, text) => {
      const next = { ...customPrompts, [kind]: text }
      persistPrompts(next)
    },
    [customPrompts, persistPrompts]
  )

  const resetPromptForGrain = useCallback(
    (kind) => {
      const next = { ...customPrompts }
      delete next[kind]
      persistPrompts(next)
    },
    [customPrompts, persistPrompts]
  )

  const isInsightGenerating = useCallback(
    (kind, id) => Boolean(insightPendingByKey[bucketKey(kind, id)]),
    [insightPendingByKey]
  )

  const value = useMemo(
    () => ({
      openModal,
      closeModal,
      runGenerate,
      savePromptForGrain,
      resetPromptForGrain,
      systemForGrain,
      isInsightGenerating,
    }),
    [
      openModal,
      closeModal,
      runGenerate,
      savePromptForGrain,
      resetPromptForGrain,
      systemForGrain,
      isInsightGenerating,
    ]
  )

  const cachedText = currentKey && typeof cache[currentKey] === 'string' ? cache[currentKey] : ''
  const modalLoading = Boolean(currentKey && insightPendingByKey[currentKey])

  return (
    <BucketInsightsContext.Provider value={value}>
      {children}
      {modalOpen && (
        <BucketInsightsModal
          kind={modalKind}
          bucketId={modalId}
          label={modalLabel}
          cachedText={cachedText}
          loading={modalLoading}
          error={error}
          lastModel={lastModel}
          canCallLlm={canCallLlm}
          onClose={closeModal}
          onGenerate={() => runGenerate()}
          savePromptForGrain={savePromptForGrain}
          resetPromptForGrain={resetPromptForGrain}
          systemForGrain={systemForGrain}
          defaultPromptForGrain={(k) => DEFAULT_BUCKET_INSIGHT_PROMPTS[k]}
        />
      )}
    </BucketInsightsContext.Provider>
  )
}

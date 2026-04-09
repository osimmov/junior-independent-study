import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import BucketColumn from './BucketColumn.jsx'
import { tasksInBucket } from '../lib/tasks.js'

export const COLUMN_WIDTH = 280
const EDGE_THRESHOLD = 120

const PREPEND_COLUMNS = {
  day: 14,
  week: 4,
  month: 3,
  year: 2,
}

function collisionDetectionStrategy(args) {
  const first = pointerWithin(args)
  if (first.length) return first
  return closestCorners(args)
}

const HorizonGrainStrip = forwardRef(function HorizonGrainStrip(
  { grain, columnSpecs, tasks, onTasksDragEnd, leftAnchorKey, onExpandLeft, onExpandRight },
  ref
) {
  const innerRef = useRef(null)
  const setRefs = useCallback(
    (node) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  const justExpandedLeft = useRef(false)
  const didInitialScroll = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event) => {
      onTasksDragEnd(grain, event)
    },
    [grain, onTasksDragEnd]
  )

  useLayoutEffect(() => {
    if (!justExpandedLeft.current) return
    const el = innerRef.current
    if (!el) return
    const n = PREPEND_COLUMNS[grain] ?? 14
    el.scrollLeft += n * COLUMN_WIDTH
    justExpandedLeft.current = false
  }, [grain, leftAnchorKey])

  useLayoutEffect(() => {
    if (didInitialScroll.current) return
    const el = innerRef.current
    if (!el) return
    const cur = el.querySelector('[data-current-bucket]')
    if (cur) {
      cur.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' })
    }
    didInitialScroll.current = true
  }, [grain, columnSpecs])

  useEffect(() => {
    didInitialScroll.current = false
  }, [grain])

  useEffect(() => {
    const el = innerRef.current
    if (!el) return

    const onScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      const hitLeft = el.scrollLeft < EDGE_THRESHOLD
      const hitRight = el.scrollLeft > maxScroll - EDGE_THRESHOLD
      if (hitLeft) {
        justExpandedLeft.current = true
        onExpandLeft?.()
      } else if (hitRight) {
        onExpandRight?.()
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [grain, onExpandLeft, onExpandRight])

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy} onDragEnd={handleDragEnd}>
      <div
        ref={setRefs}
        className="flex flex-1 overflow-x-auto overflow-y-hidden min-h-0 min-w-0 h-full"
      >
        {columnSpecs.map((spec) => {
          const colTasks = tasksInBucket(tasks, grain, spec.id)
          return (
            <BucketColumn
              key={spec.id}
              grain={grain}
              bucketId={spec.id}
              title={spec.title}
              subtitle={spec.subtitle}
              isCurrent={spec.isCurrent}
              columnWidth={COLUMN_WIDTH}
              tasks={colTasks}
              onAddTask={spec.onAddTask}
              onToggleTask={spec.onToggleTask}
              onEditTask={spec.onEditTask}
              onDeleteTask={spec.onDeleteTask}
              onOpenTask={spec.onOpenTask}
            />
          )
        })}
      </div>
    </DndContext>
  )
})

export default HorizonGrainStrip

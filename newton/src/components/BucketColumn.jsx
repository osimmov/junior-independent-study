import { useState } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskItem from './TaskItem.jsx'
import { useBucketInsights } from '../contexts/BucketInsightsContext.jsx'
import { bucketKey } from '../lib/tasks.js'

function SortableTaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onOpen,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-60 relative z-10' : ''}
    >
      <TaskItem
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpen={onOpen}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  )
}

function BucketColumn({
  grain,
  bucketId,
  title,
  subtitle,
  isCurrent,
  columnWidth,
  tasks,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenTask,
}) {
  const [inputValue, setInputValue] = useState('')
  const { openModal, isInsightGenerating } = useBucketInsights()
  const insightBusy = isInsightGenerating(grain, bucketId)

  const containerId = bucketKey(grain, bucketId)
  const ids = tasks.map((t) => t.id)

  const handleAdd = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddTask(inputValue.trim())
      setInputValue('')
    }
  }

  const headerClass = isCurrent ? 'text-newton-today' : 'text-newton-muted'

  return (
    <div
      className="flex flex-col flex-shrink-0 min-w-0 border-r border-newton-border h-full min-h-0"
      style={{ width: `${columnWidth}px` }}
      {...(isCurrent && grain === 'day' ? { 'data-today': '' } : {})}
      {...(isCurrent ? { 'data-current-bucket': containerId } : {})}
    >
      <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2 shrink-0">
        <h2 className={`text-base font-medium min-w-0 leading-snug ${headerClass}`}>
          <span className="block truncate">{title}</span>
          {subtitle && (
            <span className="block text-sm font-normal opacity-90 truncate mt-0.5">{subtitle}</span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => openModal(grain, bucketId, subtitle ? `${title} · ${subtitle}` : title)}
          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
            insightBusy
              ? 'text-newton-today bg-newton-today/10'
              : 'text-newton-muted hover:text-newton-today hover:bg-white/5'
          }`}
          title={insightBusy ? 'Insight is generating…' : 'Insights for this column'}
          aria-label={insightBusy ? 'Column insights (generating)' : 'Open column insights'}
          aria-busy={insightBusy}
        >
          {insightBusy ? (
            <span
              className="block h-4 w-4 rounded-full border-2 border-newton-today/70 border-t-transparent animate-spin"
              aria-hidden
            />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          )}
        </button>
      </div>

      <SortableContext id={containerId} items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex-1 flex flex-col min-h-0 px-3 pb-3">
          <div className="flex-1 overflow-y-auto rounded-lg border border-transparent min-h-[200px]">
            <div className="min-h-[180px] flex flex-col px-1 py-3 select-none gap-2">
              <input
                type="text"
                placeholder="Add…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleAdd}
                className="w-full px-3 py-2 bg-newton-charcoal/60 border border-newton-border rounded-lg text-sm text-newton-text placeholder-newton-muted focus:outline-none focus:ring-1 focus:ring-newton-border focus:border-newton-border"
              />
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onOpen={onOpenTask}
                />
              ))}
            </div>
          </div>
        </div>
      </SortableContext>
    </div>
  )
}

export default BucketColumn

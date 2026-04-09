import { useEffect, useState } from 'react'

const GRAIN_TITLES = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
}

function BucketInsightsModal({
  kind,
  bucketId,
  label,
  cachedText,
  loading,
  error,
  lastModel,
  canCallLlm,
  onClose,
  onGenerate,
  savePromptForGrain,
  resetPromptForGrain,
  systemForGrain,
  defaultPromptForGrain,
}) {
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState(() => systemForGrain(kind))

  useEffect(() => {
    setDraftPrompt(systemForGrain(kind))
  }, [kind, systemForGrain])

  const grainTitle = GRAIN_TITLES[kind] ?? kind

  const handleSavePrompt = () => {
    savePromptForGrain(kind, draftPrompt)
    setShowPromptEditor(false)
  }

  const handleCancelPrompt = () => {
    setDraftPrompt(systemForGrain(kind))
    setShowPromptEditor(false)
  }

  const handleResetPrompt = () => {
    resetPromptForGrain(kind)
    setDraftPrompt(defaultPromptForGrain(kind))
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-newton-charcoal/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-newton-border bg-newton-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bucket-insight-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-newton-border px-4 py-3 shrink-0">
          <div className="min-w-0">
            <h2 id="bucket-insight-title" className="text-sm font-semibold text-newton-text truncate">
              Insights · {grainTitle} · {label}
            </h2>
            <p className="text-xs text-newton-muted mt-0.5 truncate" title={bucketId}>
              {bucketId}
            </p>
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-white/10 text-newton-muted hover:text-newton-text shrink-0"
            onClick={onClose}
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

        <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1 min-h-0">
          {!canCallLlm && (
            <p className="text-sm text-newton-muted">
              Complete at least one task in this column to generate AI insights. Your incomplete list is
              still private to you; the model only runs when there is finished work to reflect on.
            </p>
          )}

          {canCallLlm && !cachedText && !loading && !error && (
            <p className="text-sm text-newton-muted">
              No saved insight for this column yet. Generate one to send your completed and open tasks
              to the local model ({lastModel}).
            </p>
          )}

          {loading && (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-xl border border-newton-border bg-newton-charcoal/50 px-6 py-10"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <span
                className="h-11 w-11 rounded-full border-2 border-newton-border border-t-newton-today shadow-[0_0_20px_rgba(224,124,76,0.2)] animate-spin"
                aria-hidden
              />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-newton-text animate-pulse">Generating insight</p>
                <p className="text-xs text-newton-muted">
                  You can close this window — it will finish in the background.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-200 whitespace-pre-wrap"
            >
              {error}
            </div>
          )}

          {cachedText && (
            <div className="text-sm text-newton-text whitespace-pre-wrap">{cachedText}</div>
          )}
        </div>

        <div className="border-t border-newton-border px-4 py-3 space-y-2 shrink-0">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canCallLlm || loading}
              onClick={onGenerate}
              className="px-3 py-1.5 bg-newton-surface hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-newton-text rounded-lg text-sm transition-colors border border-newton-border"
            >
              {cachedText ? 'Regenerate' : 'Generate insight'}
            </button>
            <button
              type="button"
              onClick={() => setShowPromptEditor((v) => !v)}
              className="px-3 py-1.5 border border-newton-border hover:bg-white/5 text-newton-text rounded-lg text-sm transition-colors"
            >
              {showPromptEditor ? 'Hide prompt' : 'Edit prompt'}
            </button>
          </div>

          {showPromptEditor && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs text-newton-muted">
                System instructions for {grainTitle.toLowerCase()} columns only
              </label>
              <textarea
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                rows={8}
                className="w-full resize-y bg-newton-charcoal/50 border border-newton-border rounded-lg px-3 py-2 text-sm text-newton-text focus:outline-none focus:ring-1 focus:ring-newton-border"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSavePrompt}
                  className="px-3 py-1.5 bg-newton-today/20 hover:bg-newton-today/30 text-newton-today rounded-lg text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelPrompt}
                  className="px-3 py-1.5 border border-newton-border text-newton-text rounded-lg text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPrompt}
                  className="px-3 py-1.5 text-newton-muted hover:text-newton-text text-sm"
                >
                  Reset to default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BucketInsightsModal

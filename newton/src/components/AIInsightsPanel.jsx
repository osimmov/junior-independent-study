import { useEffect, useRef, useState } from 'react'

// Productivity Q&A: local Ollama answers from the activity changelog (see src/config/ollama.js).
function AIInsightsPanel({ messages, error, loading, onSendMessage }) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  function handleSubmit(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || loading) return
    setDraft('')
    onSendMessage(text)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-newton-charcoal">
      <div className="shrink-0 px-6 pt-6 pb-3 border-b border-newton-border/80">
        <h1 className="text-xl font-bold text-newton-text mb-1">AI Insights</h1>
        <p className="text-newton-muted text-sm max-w-2xl">
          Ask questions about your productivity. Replies use your activity changelog (creates, edits,
          completions, deletions) from the Progress panel.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
        {messages.length === 0 && !loading && (
          <p className="text-newton-muted text-sm">
            Try: “What did I finish this week?” or “Am I creating more tasks than I complete?”
          </p>
        )}

        <ul className="flex flex-col gap-3" aria-live="polite">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[min(100%,36rem)] rounded-2xl rounded-br-md bg-newton-surface border border-newton-border px-4 py-2.5 text-sm text-newton-text'
                    : 'max-w-[min(100%,40rem)] rounded-2xl rounded-bl-md bg-newton-charcoal border border-newton-border/90 px-4 py-2.5 text-sm text-newton-text whitespace-pre-wrap'
                }
              >
                {m.content}
              </div>
            </li>
          ))}
          {loading && (
            <li className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-newton-border/90 px-4 py-2.5 text-sm text-newton-muted">
                Thinking…
              </div>
            </li>
          )}
        </ul>
        <div ref={bottomRef} />
      </div>

      {error && (
        <div
          role="alert"
          className="shrink-0 mx-6 mb-2 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200 whitespace-pre-wrap"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 p-6 pt-2 border-t border-newton-border/80 flex gap-2 items-end"
      >
        <label htmlFor="insights-chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="insights-chat-input"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Ask about your activity…"
          disabled={loading}
          className="flex-1 min-h-[2.75rem] max-h-32 resize-y rounded-lg border border-newton-border bg-newton-surface px-3 py-2 text-sm text-newton-text placeholder:text-newton-muted focus:outline-none focus:ring-1 focus:ring-newton-border disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          className="shrink-0 px-4 py-2 bg-newton-surface hover:bg-newton-border border border-newton-border disabled:opacity-50 disabled:cursor-not-allowed text-newton-text rounded-lg transition-colors h-[2.75rem]"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default AIInsightsPanel

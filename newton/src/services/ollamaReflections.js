import { OLLAMA_BASE_URL, OLLAMA_REFLECTIONS_MODEL } from '../config/ollama.js'

/** Max log lines sent to the model (newest first). */
export const REFLECTIONS_LOG_ENTRY_LIMIT = 80

/** Slightly larger context for multi-turn productivity chat. */
export const PRODUCTIVITY_CHAT_LOG_ENTRY_LIMIT = 120

const SYSTEM_PROMPT = `You are a friendly productivity coach. The user will paste a chronological activity log of their tasks (creates, edits, completions, deletions).

Give 2–4 short, actionable reflections or tips based on patterns you notice. Be supportive and practical. Keep the whole reply under about 200 words. Use plain text only (no markdown headings unless minimal).`

const CHAT_SYSTEM_PROMPT = `You are a helpful productivity assistant for Newton, a task planning app.

You will receive an activity changelog (newest entries first): task creates, edits, completions, and deletions with timestamps.

Rules:
- Answer the user's questions using this log and the conversation so far. If something is not in the log, say you do not see it there rather than inventing activity.
- Be concise and practical. Plain text is fine; avoid heavy markdown.
- You may summarize patterns, compare time periods, or suggest habits—always tied to what the log actually shows when possible.`

function actionPhrase(type) {
  switch (type) {
    case 'created':
      return 'was created'
    case 'edited':
      return 'was edited'
    case 'deleted':
      return 'was deleted'
    case 'completed':
      return 'was marked as done'
    default:
      return 'had an update'
  }
}

/**
 * One human-readable line per log entry (newest entries first in the array).
 */
export function formatActivityLogSummary(activities, limit = REFLECTIONS_LOG_ENTRY_LIMIT) {
  if (!activities?.length) {
    return 'No activity recorded yet.'
  }

  const slice = activities.slice(0, limit)
  const lines = slice.map((entry) => {
    const line =
      typeof entry.message === 'string' && entry.message.trim()
        ? entry.message.trim()
        : `${entry.taskName || 'A task'} ${actionPhrase(entry.type)}`
    return `- ${entry.date} ${entry.time}: ${line}`
  })
  return lines.join('\n')
}

/**
 * POST /api/chat (non-streaming). Returns assistant text or throws with a user-facing message.
 */
export async function fetchOllamaReflections(formattedLog) {
  const url = `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`
  const userContent = `Activity log:\n\n${formattedLog}`

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_REFLECTIONS_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    })
  } catch (err) {
    const hint = `Could not reach Ollama at ${OLLAMA_BASE_URL}. Is it running? Try: ollama serve`
    throw new Error(`${hint}${err?.message ? ` (${err.message})` : ''}`)
  }

  const rawText = await res.text()

  if (!res.ok) {
    const hint = `Make sure Ollama is running and the model is pulled: ollama pull ${OLLAMA_REFLECTIONS_MODEL}`
    const detail = rawText?.trim() || res.statusText
    throw new Error(`${detail}\n\n${hint}`)
  }

  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    throw new Error(`Invalid JSON from Ollama.\n\n${rawText.slice(0, 500)}`)
  }

  const content = data?.message?.content
  if (typeof content !== 'string') {
    throw new Error('Unexpected Ollama response shape (missing message.content).')
  }

  return content.trim()
}

/**
 * Multi-turn chat: system message includes fresh changelog; `chatMessages` are user/assistant only.
 * @param {{ role: 'user' | 'assistant', content: string }[]} chatMessages
 */
export async function sendProductivityChatMessage(activities, chatMessages) {
  const formattedLog = formatActivityLogSummary(activities, PRODUCTIVITY_CHAT_LOG_ENTRY_LIMIT)
  const systemContent = `${CHAT_SYSTEM_PROMPT}\n\n---\nActivity changelog (newest first):\n${formattedLog}\n---`

  const url = `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_REFLECTIONS_MODEL,
        stream: false,
        messages: [{ role: 'system', content: systemContent }, ...chatMessages],
      }),
    })
  } catch (err) {
    const hint = `Could not reach Ollama at ${OLLAMA_BASE_URL}. Is it running? Try: ollama serve`
    throw new Error(`${hint}${err?.message ? ` (${err.message})` : ''}`)
  }

  const rawText = await res.text()

  if (!res.ok) {
    const hint = `Make sure Ollama is running and the model is pulled: ollama pull ${OLLAMA_REFLECTIONS_MODEL}`
    const detail = rawText?.trim() || res.statusText
    throw new Error(`${detail}\n\n${hint}`)
  }

  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    throw new Error(`Invalid JSON from Ollama.\n\n${rawText.slice(0, 500)}`)
  }

  const content = data?.message?.content
  if (typeof content !== 'string') {
    throw new Error('Unexpected Ollama response shape (missing message.content).')
  }

  return content.trim()
}

/**
 * End-to-end: format activities and call Ollama.
 */
export async function generateReflectionsFromActivities(activities) {
  const summary = formatActivityLogSummary(activities)
  return fetchOllamaReflections(summary)
}

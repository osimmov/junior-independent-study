import { OLLAMA_BASE_URL, OLLAMA_INSIGHTS_MODEL } from '../config/ollama.js'

export { OLLAMA_INSIGHTS_MODEL }

function bulletTaskLine(task) {
  const title = (task.text ?? '').trim() || '(untitled)'
  const desc = (task.description ?? '').trim()
  if (desc) return `- ${title} — ${desc}`
  return `- ${title}`
}

/** Build the user message sent to the model for one bucket. */
export function buildBucketInsightUserMessage(grain, bucketId, label, split) {
  const completedLines =
    split.completed.length > 0
      ? split.completed.map(bulletTaskLine).join('\n')
      : '(none)'
  const incompleteLines =
    split.incomplete.length > 0
      ? split.incomplete.map(bulletTaskLine).join('\n')
      : '(none)'

  const lines = [`Grain: ${grain}`, `Bucket id: ${bucketId}`, `Label: ${label}`]

  if (grain === 'week') {
    lines.push(
      '',
      'Task scope: lists include tasks on each day (Mon–Sun) in this ISO week, plus any tasks on the week column itself.'
    )
  }

  lines.push(
    '',
    'Completed tasks:',
    completedLines,
    '',
    'Incomplete tasks:',
    incompleteLines
  )

  return lines.join('\n')
}

/**
 * POST /api/chat (non-streaming). Returns assistant text or throws with a user-facing message.
 */
export async function fetchBucketInsightChat(system, userContent) {
  const url = `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`
  const model = OLLAMA_INSIGHTS_MODEL

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: system },
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
    const hint = `Make sure Ollama is running and the model is pulled: ollama pull ${model}`
    const detail = rawText?.trim() || res.statusText
    throw new Error(`${detail}\n\nModel: ${model}\n\n${hint}`)
  }

  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    throw new Error(`Invalid JSON from Ollama.\n\nModel: ${model}\n\n${rawText.slice(0, 500)}`)
  }

  const content = data?.message?.content
  if (typeof content !== 'string') {
    throw new Error(`Unexpected Ollama response (missing message.content).\n\nModel: ${model}`)
  }

  return { text: content.trim(), model }
}

// Ollama defaults for local LLM (no API key). Override via Vite env if needed:
// VITE_OLLAMA_BASE_URL, VITE_OLLAMA_REFLECTIONS_MODEL

export const OLLAMA_BASE_URL =
  import.meta.env.VITE_OLLAMA_BASE_URL ?? 'http://localhost:11434'

/** Swap model here (or set VITE_OLLAMA_REFLECTIONS_MODEL) — e.g. deepseek-r1:7b */
export const OLLAMA_REFLECTIONS_MODEL =
  import.meta.env.VITE_OLLAMA_REFLECTIONS_MODEL ?? 'deepseek-r1:7b'

/** Column insights use the same Ollama host; model can differ via VITE_OLLAMA_INSIGHTS_MODEL */
export const OLLAMA_INSIGHTS_MODEL =
  import.meta.env.VITE_OLLAMA_INSIGHTS_MODEL ??
  import.meta.env.VITE_OLLAMA_REFLECTIONS_MODEL ??
  'deepseek-r1:7b'

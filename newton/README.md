# Newton (Horizon UI)

## Column AI insights (Ollama)

Horizon columns can call a **local Ollama** instance over HTTP. Configuration lives in `src/config/ollama.js` and Vite env vars:

| Variable | Purpose |
|----------|---------|
| `VITE_OLLAMA_BASE_URL` | Base URL (default `http://localhost:11434`) |
| `VITE_OLLAMA_INSIGHTS_MODEL` | Model for **per-column** insights (defaults to `VITE_OLLAMA_REFLECTIONS_MODEL` or `deepseek-r1:7b`) |
| `VITE_OLLAMA_REFLECTIONS_MODEL` | Model for the global **AI Insights** activity panel |

**Run Ollama** (example):

```bash
ollama serve
ollama pull <your-model>
```

**What is sent for a column insight**

Non-streaming `POST {base}/api/chat` with:

- **System:** default instructions for that grain (day / week / month / year), or your custom text saved per grain in `localStorage` under `newton-bucket-insight-prompts-v1`.
- **User:** grain name, stable bucket id (e.g. `day:2026-04-08`, `week:2026-W15`, `month:2026-04`, `year:2026`), human label, then two sections: bullet list of **completed** task titles (with optional descriptions), and bullet list of **incomplete** tasks (or `(none)`).

The API is **not called** unless there is at least one **completed** task in that bucket; the modal shows static copy instead.

Insight text is cached per bucket in `localStorage` (`newton-bucket-insight-cache-v1`). Use **Regenerate** to fetch again.

Tasks and activities are stored in `localStorage` under `newton-data` (`version: 2` with a flat `tasks` array).

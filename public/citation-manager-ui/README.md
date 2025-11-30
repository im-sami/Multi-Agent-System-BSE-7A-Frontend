# Citation Manager UI: API Integration

This UI talks only to the Supervisor. It never calls agents directly. Authentication is enforced via `Authorization: Bearer <token>`.

## API Modules

- `src/api/citation.ts`
  - `submitCitation(agentData, includeDOI)` submits a single citation request through `POST /api/supervisor/request`.
  - Attaches `save`, `save_all`, and `user_id` when authenticated so the agent persists generated entries.

- `src/api/bibliography.ts`
  - `generateFinalBibliography(items, style, removeDuplicates)` proxies to `POST /api/supervisor/bibliography`.
  - Sends `save`, `save_all`, `user_id` for persistence when authenticated.

- `src/api/pdf.ts`
  - `uploadPdfForReferences(file, opts)` uploads a PDF via `POST /api/supervisor/upload/pdf`.
  - Includes `style`, `includeDOI`, `llm_parse`, and optionally `save`, `save_all`, `user_id`.

## Saved Citations

- When authenticated, generated citations and extracted references are saved to Long‑Term Memory (LTM) and appear under "Saved Citations".
- `save_all` bypasses duplicate checks to ensure all entries persist when explicitly desired.

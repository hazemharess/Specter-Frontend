# BACKEND-INTEGRATION.md

How to wire this frontend to the real backend (RAG retrieval, ingestion
pipeline, voice agent). The frontend was built mock-first: every data access
goes through `/lib/api/*`, all shapes live in `/lib/types.ts`, and no
component imports from `/lib/data/` directly. Swapping mock → real means
re-implementing the functions in `/lib/api/` against HTTP/SSE/WS — nothing
else changes.

Assumptions: JWT bearer auth on every call (`Authorization: Bearer <token>`),
JSON bodies, base URL from `NEXT_PUBLIC_API_BASE_URL`.

---

## 1. API contract table

| Mock function | Real endpoint | Method | Request | Response | Streams |
|---|---|---|---|---|---|
| `api.assistant.sendMessage({threadId?, scope, content})` | `/api/v1/assistant/messages` | POST | `{ threadId?: string, scope: Scope, content: string }` | SSE stream of `AssistantStreamEvent` | **yes (SSE)** |
| `api.assistant.getThread(id)` | `/api/v1/threads/:id` | GET | — | `Thread` (messages newest-last) | no |
| `api.assistant.listThreads(caseId?)` | `/api/v1/threads?caseId=` | GET | query params | `Paginated<Thread>` (messages omitted) | no |
| `api.cases.list(query?)` | `/api/v1/cases?query=&page=&pageSize=` | GET | query params | `Paginated<Case>` | no |
| `api.cases.get(id)` | `/api/v1/cases/:id` | GET | — | `Case` | no |
| `api.cases.documents(id)` | `/api/v1/cases/:id/documents` | GET | — | `Paginated<LegalDocument>` | no |
| `api.cases.sessions(id)` | `/api/v1/cases/:id/sessions` | GET | — | `CaseSession[]` | no |
| `api.cases.drafts(id)` | `/api/v1/cases/:id/drafts` | GET | — | `Paginated<Draft>` | no |
| `api.workflows.list()` | `/api/v1/workflows` | GET | — | `Workflow[]` | no |
| `api.workflows.get(slug)` | `/api/v1/workflows/:slug` | GET | — | `Workflow` (with `steps`) | no |
| `api.workflows.generateDraft({workflowId, caseId, answers})` | `/api/v1/workflow-runs/:runId/generate` | POST | collected slot values | SSE (reasoning steps) resolving to `Draft` | yes (SSE) |
| `api.workflows.uploadDocument(file)` | `/api/v1/documents` | POST (multipart) | file + `{caseId?}` | `{ docId }` then status polling | no (status SSE optional) |
| `api.workflows.saveDraft(draft)` | `/api/v1/drafts` | POST | `Draft` | `{ id }` | no |
| `api.library.tree()` | `/api/v1/library/tree` | GET | — | `LibraryNode[]` | no |
| `api.library.search(query, kind?)` | `/api/v1/library/documents?query=&kind=` | GET | query params | `Paginated<LegalDocument>` | no |
| `api.library.getDocument(id)` | `/api/v1/documents/:id` | GET | — | `LegalDocument` | no |
| `api.library.getContent(id)` | `/api/v1/documents/:id/content?from=&to=` | GET | page range | `DocumentContent` | no |
| `api.history.list()` | `/api/v1/history?page=&pageSize=` | GET | — | `Paginated<HistoryEntry>` | no |
| `api.voice.startSession()` | `wss://…/api/v1/voice/session?threadId=&scope=` | WS | audio frames up | `VoiceTranscriptEvent` frames down | **yes (WS)** |

All request/response schemas reference `/lib/types.ts` verbatim — those types
ARE the contract. List endpoints return `Paginated<T>`; the mock returns bare
arrays, so when wiring, unwrap `items` inside `/lib/api/*` (components already
receive plain arrays and stay untouched).

---

## 2. Streaming protocol spec (assistant answers)

`sendMessage` in `/lib/api/assistant.ts` is an **async generator** yielding
`AssistantStreamEvent`. The UI consumes it with `for await`. A real SSE
adapter must yield the same discriminated union in the same order:

```
reasoning_step*  →  reasoning_done  →  token*  →  citation*  →  done
```

SSE wire format (event name = union tag, data = JSON payload):

```
event: reasoning_step
data: {"step":{"id":"rs-1","kind":"analyze","label":"تحليل السؤال","detail":"…","chips":[{"label":"عقد_البيع_الابتدائي.pdf","docId":"doc-contract","icon":"pdf"}]}}

event: reasoning_done
data: {"stepCount":4}

event: token
data: {"text":"موقف "}

event: token
data: {"text":"الموكلة "}

event: citation
data: {"citation":{"id":"cit-contract-4","index":1,"docId":"doc-contract","docName":"عقد البيع الابتدائي","page":4,"snippet":"يلتزم الطرف الأول…"}}

event: done
data: {"message":{ …full Message object, persisted server-side… }}
```

UI behavior tied to this sequence (do not reorder):

- Each `reasoning_step` appends a step to the "جارٍ العمل…" block (400ms UI stagger).
- The **first `token`** collapses the reasoning block to its summary line and starts word-by-word rendering. Token text must include inline `[cite:N]` markers where citations belong.
- `citation` events bind marker `N` → `Citation`; markers rendered before their citation arrives are inert until bound.
- `done` carries the final materialized `Message` (authoritative content + citations + `isRefusal`). The UI replaces its accumulated state with it.
- Refusals are normal `done` messages with `isRefusal: true` — never an HTTP error.

Adapter sketch (the only code that changes):

```ts
export async function* sendMessage(params: SendParams) {
  const res = await fetch(`${BASE}/api/v1/assistant/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(params),
  });
  for await (const event of parseSSE(res.body!)) {
    yield JSON.parse(event.data) as AssistantStreamEvent;
  }
}
```

---

## 3. Citation deep-link contract

Clicking a citation opens the source panel on the **exact page with the
passage highlighted**. Per citation the frontend needs:

| Field | Used for |
|---|---|
| `docId` | fetch `LegalDocument` + `DocumentContent` |
| `docName` | panel header + source chips |
| `page` (1-based) | open the right page |
| `snippet` | exact substring matched against the page text and wrapped in the gold highlight |
| `boundingBox?` `{x,y,width,height}` (percentages) | preferred highlight once pages are rendered images |

Therefore the **ingestion pipeline must store per chunk** (`Chunk` type):
`docId`, `page`, `startOffset`/`endOffset` (char offsets in the page's
extracted text layer), the verbatim `text`, and — if OCR produces geometry —
a bounding box. The retrieval service must map every generated citation back
to its chunk and emit `snippet` = the verbatim chunk substring. If the
snippet does not match the page text exactly, the panel still opens on the
page but cannot highlight — treat that as a data bug, not a UI fallback.

`DocumentContent` today is styled text (`pages[].paragraphs`). When the real
reader serves page images, keep the same shape plus an `imageUrl` per page;
`PdfPage.tsx` is the single component to touch.

---

## 4. Workflow / slot-filling contract

Workflow definitions are **backend-owned**. The runner
(`components/workflow/WorkflowRunner.tsx`) renders whatever `Workflow.steps`
arrive; nothing about the إنذار/مذكرة flows is hardcoded in components.

State machine shape the backend drives:

```
run = {
  id, workflowId, caseId,
  currentStepId,
  steps: [{ stepId, status: "pending" | "active" | "done", collected?: … }]
}
```

- `POST /api/v1/workflows/:id/runs` → creates a run, returns the run with the first step `active`.
- `PATCH /api/v1/workflow-runs/:runId/steps/:stepId` with the collected input (`{caseId}`, `{docIds}`, or `{slot, value}`) → returns the updated run; the frontend advances to whatever `currentStepId` says. Server-side validation failures return the same run with an `error` message on the step.
- `slot_questions` steps carry `questions: SlotQuestion[]`; the UI asks them one at a time and PATCHes each answer, so the backend may inject follow-up questions by returning an extended list.
- The `generate` step is `POST …/generate` and streams the same SSE protocol as the assistant (reasoning steps, no tokens needed), resolving to a `Draft`.
- `Draft.body` contains `[[field:key]]` tokens; `Draft.fields` maps each key to a `DraftField` with `sourceType: "user_answer" | "citation"` (+ `citation` when applicable). This is what powers the gold-underline provenance popovers — the generation service must record, per filled field, where the value came from.

---

## 5. Voice integration notes

`api.voice.startSession()` is an async generator of `VoiceTranscriptEvent`,
consumed pull-based by `components/orb/VoiceMode.tsx`. Designed for an
ElevenLabs/Vapi-style websocket:

- **Down (server → client)**, mapped 1:1 to `VoiceTranscriptEvent`:
  - `state` (`idle | listening | thinking | speaking`) drives the orb animation states.
  - `user_partial` / `user_final` — live ASR transcript (right-aligned line).
  - `reasoning_step`, `citation` — same objects as chat; render identically.
  - `assistant_token` — streamed TTS-aligned text under the orb.
  - `assistant_final` — the persisted `Message`.
  - `session_end`.
- **Up (client → server)**: audio chunks, `{type:"mute"}`, `{type:"end"}`. The mock fakes user speech with canned turns; the real adapter replaces the tap-to-talk pump in `VoiceMode` with mic capture, keeping the same event handling.
- On end, the accumulated final turns are inserted into the chat thread as normal `Message`s — the backend should persist them under the same `threadId` so `getThread` returns the voice exchange.

---

## 6. Upload / ingestion contract

- `POST /api/v1/documents` (multipart: file, `caseId?`, `libraryPath?`) → `202 { docId }`.
- Document status enum (already typed as `DocumentStatus` and rendered by the UI in case documents and upload chips):

```
uploading → ocr → indexing → ready
                         ↘ failed
```

- Status delivery: `GET /api/v1/documents/:id/status` polling or an SSE channel `/api/v1/documents/:id/events`. The workflow upload step currently fakes a 1.5s "جارٍ الفهرسة…" window (`uploadDocument` in `/lib/api/workflows.ts`); replace with real upload + status subscription there only.
- A document is scope-eligible (askable, citable) only at `ready`; UI already disables "اسأل عن هذا المستند" otherwise.

---

## 7. Swap checklist (mock → real)

1. Add `NEXT_PUBLIC_API_BASE_URL` (+ auth token plumbing) to `.env`.
2. `lib/api/assistant.ts` — replace generator internals with the SSE adapter (§2).
3. `lib/api/cases.ts` — fetch + unwrap `Paginated`.
4. `lib/api/workflows.ts` — runs/PATCH/generate + real multipart upload (§4, §6).
5. `lib/api/library.ts` — fetch; point `getContent` at the content endpoint (§3).
6. `lib/api/history.ts` — fetch.
7. `lib/api/voice.ts` — websocket adapter yielding `VoiceTranscriptEvent` (§5).
8. Delete `/lib/data/` once nothing imports it.

That is the whole surface: 6 API modules + 1 env var. If integration wants
to touch a component, the architecture contract has been violated — fix the
API module instead.

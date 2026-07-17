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
| `api.assistant.sendMessage({threadId?, scope, content})` | `/api/v1/assistant/messages` | POST | `{ threadId?: string, scope: Scope, content: string }` | SSE stream of `AssistantStreamEvent` (may emit `plan`, §8) | **yes (SSE)** |
| `api.agent.recommend({content, scope})` | *(folds into `sendMessage` — §8)* | — | `PlanRequest` | `AgentRecommendation` | no |
| `api.agent.executePlan(plan)` | `/api/v1/agent/plans/:id/execute` | POST | `{ plan }` (or `:id`) | SSE stream of `PlanExecutionEvent` | **yes (SSE)** |
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
reasoning_step*  →  reasoning_done  →  ( token* → citation*  |  plan )  →  done
```

The branch is the model's call: an informational question streams `token*`/
`citation*` (prose answer); an **executable request** streams a single `plan`
event instead (a recommended plan, no prose) — see §8 for the full agent loop.

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

Executable-request variant — `plan` replaces the `token`/`citation` run:

```
event: reasoning_step
data: {"step":{"id":"pr-2","kind":"search","label":"مطابقة المهارة المناسبة من مهارات المكتب","detail":"المهارة: صياغة المحررات"}}

event: reasoning_done
data: {"stepCount":3}

event: plan
data: {"lead":"يمكنني تنفيذ ذلك ضمن مهارة «صياغة المحررات». أعددتُ خطة مقترحة — راجع الخطوات واعتمدها للبدء.","plan":{ …full Plan object, §8… }}

event: done
data: {"message":{ …Message with plan + planStatus:"recommended"… }}
```

UI behavior tied to this sequence (do not reorder):

- Each `reasoning_step` appends a step to the "جارٍ العمل…" block (400ms UI stagger).
- The **first `token`** collapses the reasoning block to its summary line and starts word-by-word rendering. Token text must include inline `[cite:N]` markers where citations belong.
- `citation` events bind marker `N` → `Citation`; markers rendered before their citation arrives are inert until bound.
- `plan` renders a **plan card** on the message (`lead` as the short intro above it) with an "اعتماد الخطة" button. Nothing executes until the lawyer approves — approval calls `executePlan` (§8). Mutually exclusive with `token`/`citation` in one message.
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
- **Document studio** (`components/workflow/DocumentStudio.tsx`) edits a `Draft` entirely client-side: field edits, free-prose editing, and clause insertion all mutate local state. "حفظ في القضية" → `saveDraft` (above). Word/PDF export are client-side (`.doc` HTML blob / print window) — **no export endpoints**. If server-rendered DOCX/PDF is later wanted, add `POST /api/v1/drafts/:id/export?format=docx|pdf` returning a file; the studio's `downloadWord`/`downloadPdf` are the only call sites to swap.

### Case-locked conversations

Locking a chat to a case is **pure client scoping** — no new endpoint. `ChatView`
sends `scope: { type: "case", caseId }` (or `type: "document", docId, caseId`) with
every `sendMessage`, exactly as the §1/§2 contract already defines. The backend
**must** constrain retrieval to that `caseId` (and to that `docId` for document
scope) so a locked conversation never leaks cross-case material. The lock is a UX
guarantee surfaced from that same scope field; the assistant endpoint is unchanged.

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
2. `lib/api/assistant.ts` — replace generator internals with the SSE adapter (§2); handle the `plan` event (§8).
3. `lib/api/agent.ts` — fold `recommend` into the assistant stream; point `executePlan` at the real execute SSE (§8).
4. `lib/api/cases.ts` — fetch + unwrap `Paginated`.
5. `lib/api/workflows.ts` — runs/PATCH/generate + real multipart upload (§4, §6).
6. `lib/api/library.ts` — fetch; point `getContent` at the content endpoint (§3).
7. `lib/api/history.ts` — fetch.
8. `lib/api/voice.ts` — websocket adapter yielding `VoiceTranscriptEvent` (§5).
9. Delete `/lib/data/` once nothing imports it.

That is the whole surface: 7 API modules + 1 env var. If integration wants
to touch a component, the architecture contract has been violated — fix the
API module instead.

---

## 8. Agent layer: plan → approve → execute → deliver

The product's core loop. It is **not** a separate mode, page, or nav
destination — it is how the assistant answers **executable** requests. Reading
the plane straight:

- **Informational** request ("ما حكم المادة ٢١٥؟", "هل يجوز…") → normal cited
  answer (§2, `token`/`citation`).
- **Executable** request ("صِغ إنذارًا", "أعدّ مذكرة تقييم", "قارن العقدين") →
  the assistant reaches into the firm's **skills** (its "mind"), matches one,
  and **recommends a plan** the lawyer must approve before anything runs. On
  approval the plan executes step by step and produces real **artifacts**
  (task list, assessment memo) inline on the same message.

### 8.1 Who decides (routing)

The decision belongs to the model. Tonight it is a client-side keyword pass:
`classifyIntent()` in `lib/data/agent.ts` (verbs like صِغ/أعدّ/قارن/لخّص →
plan). `api.agent.recommend()` returns an `AgentRecommendation`
(`{intent:"answer"}` or `{intent:"plan", lead, reasoning, plan}`).

**LIVE, `recommend` disappears.** The assistant stream itself decides and emits
a `plan` event (§2) instead of tokens. `ChatView.send()` already handles that
event, so wiring the real backend means: keep streaming, and when the model
chooses to act, send `plan` + a `done` message carrying
`plan` + `planStatus:"recommended"`. Delete the client `recommend` shim.

### 8.2 Skills = the assistant's mind (backend-owned)

A **skill** is a firm-authored, reusable capability (e.g. "صياغة المحررات",
"تقييم القضايا"). It is the unit the firm tunes; it is what the model draws on
to build a plan. Skills are surfaced to the user **only** as the `capability`
label on a recommended plan card — never as a browsable list that competes with
Workflows (§4). Model:

```
skill = { id, title, capability, description, promptTemplate, tools[], firmId }
```

Suggested endpoints (registry is backend-owned, like workflow definitions):

- `GET  /api/v1/skills` → `Skill[]` (firm-scoped) — powers a future skill studio, not a nav page.
- `POST /api/v1/skills` / `PATCH …/:id` — author/tune a skill.

Retrieval-time, the model selects a skill and instantiates a `Plan` from it. A
`Plan` carries `capability` (which skill produced it) so the UI can show
"مهارة: …" on the card. **Skills ≠ Workflows.** Workflows (§4) are explicit,
user-driven, form-filling document pipelines; skills are implicit capabilities
the agent invokes autonomously when it recommends a plan.

### 8.3 Plan shape

`Plan` (see `lib/types.ts`) — `id`, `title`, `capability?`, `goal`,
`steps: PlanStep[]`, `expectedArtifacts: ArtifactKind[]`. Each `PlanStep` has an
`id`, `title`, optional `tool` (`rag_search | case_lookup | document_extract |
draft | summarize`) + `toolLabel`, and `estimatedSeconds` (paces the UI only —
the backend's real step boundaries drive it live).

### 8.4 Execute stream

`api.agent.executePlan(plan)` is an async generator of `PlanExecutionEvent`,
consumed exactly like the assistant stream. Approval (the "اعتماد الخطة" click)
triggers it; `ChatView.approvePlan()` mutates the recommending message in place.

```
POST /api/v1/agent/plans/:id/execute   (Accept: text/event-stream)

step_start*  →  step_done*  →  artifact*  →  done
```

Wire format:

```
event: step_start
data: {"stepId":"s1"}

event: step_done
data: {"stepId":"s1"}

event: artifact
data: {"artifact":{ …Artifact — see 8.5… }}

event: done
data: {}
```

UI binding (do not reorder): `step_start` marks a step active (spinner);
`step_done` flips it to a green check and appends to `executedStepIds`;
`artifact` appends a deliverable; `done` sets `planStatus:"delivered"`. Steps
interleave `step_start`/`step_done` sequentially — one active step at a time.
Approval-before-execution is a hard product rule: the execute endpoint must
never run without an explicit approve call.

### 8.5 Artifacts (deliverables)

`Artifact` is a discriminated union (`kind`), rendered by dedicated components
and **persisted** so they live in the case file, not just the chat:

- `task_list` → `TaskListArtifactData { tasks: TaskItem[] }`. `TaskItem` =
  `{ id, title, status: "done"|"review"|"pending"|"blocked", assignee:
  "lawyer"|"client", assigneeName? }`. The checkbox toggle is client-side today;
  live it should `PATCH /api/v1/artifacts/:id/tasks/:taskId {status}` so the
  firm and client share one source of truth. "مشاركة مع الموكل" / "تصدير" are
  stubs — wire to the client portal + export endpoints when they exist.
- `case_summary` → `CaseSummaryArtifactData { summary, facts[], sections[], meta? }`,
  an assessment memo. Its `sections`/`facts` should carry the same `[cite:N]` +
  `Citation` provenance as answers (§3) once retrieval-backed.

Persistence: `POST /api/v1/agent/artifacts` on `done`, linked to
`{ threadId, messageId, caseId }`. `GET /api/v1/cases/:id/artifacts` to list
them on the case. The mock materializes fixed artifacts in `lib/data/agent.ts`
(`artifactsFor(plan)`); replace with the model's real output — shapes unchanged.

### 8.6 Swap summary

`recommend` → folded into the assistant `plan` event. `executePlan` → the
execute SSE above. `classifyIntent`/`selectPlan`/`artifactsFor` (in
`lib/data/agent.ts`) are the mock's brain and are deleted with `/lib/data/`.
No component changes — `Plan`, `PlanExecutionEvent`, and `Artifact` in
`lib/types.ts` are the contract.

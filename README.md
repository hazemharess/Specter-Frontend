# المساعد القانوني — مكتب الحق للمحاماة

Arabic-first (RTL) legal AI assistant frontend for an Egyptian law firm.
Harvey-class UI, fully functional against a mock service layer with realistic
Egyptian legal dummy data — no backend required to run the full demo.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Everything works end-to-end: chat with reasoning
steps + streaming + gold citations, the split-view source panel, cases,
two fully playable workflows (إنذار على يد محضر، مذكرة دفاع), the library
reading room, history, and the voice orb.

## Where things live

- `lib/types.ts` — the API contract (backend-spec shapes).
- `lib/api/` — the ONLY data access layer; mock today, real backend later. Every function carries a `// @backend:` block with its intended endpoint.
- `lib/data/` — typed dummy data (cases, documents with fake pages, canned conversations, workflows, voice script).
- `components/` — `shell/`, `chat/`, `reader/`, `workflow/`, `orb/` + `ui.tsx` primitives.
- `docs/BACKEND-INTEGRATION.md` — API contract table, SSE streaming protocol, citation deep-link contract, workflow state machine, voice websocket notes, ingestion status enum, and the mock→real swap checklist.
- `docs/UI-SYSTEM.md` — design tokens, type/spacing scale, motion spec, component inventory.

## Demo pointers

- Suggestion cards on the home screen auto-send a question; responses cycle through canned analyses including the deliberate "لا أجد في المستندات المتاحة…" refusal.
- Click any gold ﴾١﴿ marker or source chip → the split panel opens the fake scanned page with the cited passage highlighted.
- History → "قوة موقفنا في إثبات الإخلال بالتسليم" reopens the fully populated thread.
- Workflows → «إنذار على يد محضر» runs the complete vertical flow to an editable draft with provenance popovers on every gold-underlined field.
- The mic icon in any chat input opens voice mode; tap the orb to "speak" each canned turn, then end to drop the transcript into the thread.

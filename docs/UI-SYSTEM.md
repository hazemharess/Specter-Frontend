# UI-SYSTEM.md

The design system of the Arabic legal assistant. Read this before extending
the UI — everything below is already encoded in `tailwind.config.ts`,
`app/globals.css`, and the component inventory; don't re-derive it.

**Mood: quiet, precise, expensive. A reading environment, not a dashboard.**
Light theme only, by deliberate choice (lawyers read documents all day).
Arabic-first, RTL everywhere: `<html lang="ar" dir="rtl">`, sidebar on the
right, mirrored chevrons and pagers.

---

## 1. Design tokens (CSS variables in `globals.css`, mapped in Tailwind)

| Token | Value | Tailwind class | Use |
|---|---|---|---|
| `--bg` | `#FAFAF8` | `bg-bg` | app canvas (warm paper white) |
| `--surface` | `#FFFFFF` | `bg-surface` | cards, panels, sidebar |
| `--border` | `#E8E6E1` | `border-line` | hairline 1px borders — the default separator |
| `--text-primary` | `#1A1915` | `text-ink` | body text |
| `--text-secondary` | `#6B6860` | `text-ink-2` | secondary text |
| `--text-tertiary` | `#9C9890` | `text-ink-3` | metadata, placeholders |
| `--accent` | `#1E3A34` | `bg-accent` / `text-accent` | deep counsel green — buttons, active states, focus |
| `--accent-soft` | `#EAF0EE` | `bg-accent-soft` | selected states, user bubbles, hover at /40 |
| `--gold` | `#B8935A` | `text-gold` / `border-gold` | **citations & source highlights ONLY** |
| `--gold-soft` | `rgba(184,147,90,.12)` | `bg-[var(--gold-soft)]` | gold hover/field backgrounds |
| `--danger` | `#B4462E` | `text-danger` | destructive/mute states |

Shadows: `shadow-raised` (input card, hover-lifted cards),
`shadow-floating` (drawers, popovers, source panel, the orb button). Rule:
hairline borders over shadows; shadows only on floating elements.

**Hard rules**
- One accent. Gold = evidence, nothing else. If it isn't a source/citation, it is never gold.
- No gradients anywhere except the voice orb (`components/orb/VoiceOrb.tsx`).
- Hover = `bg-accent-soft/40`, 150ms ease. Focus = 2px accent outline, offset 2px (global `:focus-visible` in globals.css).

## 2. Radius, spacing, type

- Radius: `rounded-card` 12px (cards) · `rounded-input` 8px (inputs/buttons) · `rounded-pill` 999px (chips).
- Spacing: 4px grid. Sections breathe — 48–64px between major blocks (`space-y-12`, `py-10`+).
- Type scale (Tailwind classes): `text-label` 13px · `text-body` 15px/1.7 · `text-title` 17px · `text-page` 28px. Arabic body line-height is 1.7 (set in the scale); the fake PDF pages use 1.9.
- Font: IBM Plex Sans Arabic 400/500/600/700 via `next/font` (`--font-arabic`), Latin fallback IBM Plex Sans.
- Numerals: Western digits (1, 2, 3) in data/dates/citations; Arabic-Indic digits only inside the ﴾١﴿ citation markers and step/page counters via `toArabicDigits()` in `components/chat/MessageContent.tsx`.

## 3. Motion spec (Framer Motion)

| Pattern | Spec | Where |
|---|---|---|
| Page transitions | 200ms fade + 8px rise | `app/template.tsx` |
| Cards / list items | stagger-in 40ms/item, 300ms ease-out, once per mount | cases grid, workflows grid, history, tabs |
| Reasoning steps | sequential reveal (data-driven ~650ms apart), each fades up 6px; ✓ scales in with spring `stiffness:500, damping:22` | `ReasoningSteps.tsx` |
| Split source panel | 300ms ease-out slide from the left edge (RTL-aware); chat pads to `55vw` simultaneously via CSS transition | `SourcePanel.tsx` + `ChatView.tsx` |
| Workflow steps | completed step collapses (height auto animation), next expands; connector line draws via SVG `pathLength` | `WorkflowRunner.tsx` |
| Streaming text | word-by-word, 20–40ms randomized, no cursor block | mock generator in `lib/api/assistant.ts` |
| Orb | idle 3s breathing 1→1.04 · listening ripple rings · speaking 100ms randomized scale ticks + stronger glow | `VoiceOrb.tsx` |

`prefers-reduced-motion` is respected twice: a global CSS kill-switch in
`globals.css`, and `useReducedMotion()` guards on every non-essential
Framer animation. Nothing bounces except the ✓ spring. Motion communicates
state, never decorates.

## 4. Component inventory

```
components/
  ui.tsx                 Button, Pill, Badge, Spinner, EmptyState, relativeTime/formatDateAr
  shell/
    AppShell.tsx         layout wrapper, mobile top bar + drawer state
    Sidebar.tsx          right rail (240px → icons-only <1280px → drawer <768px)
  chat/
    AssistantScreen.tsx  deep-link entry (?thread, ?case, ?doc, ?q, ?new)
    ChatView.tsx         orchestrator: streaming state machine, panel compression, voice overlay
    ChatInput.tsx        input card (attach, mic, send; Enter sends)
    ScopeChips.tsx       scope pills + case-picker popover
    SuggestionCards.tsx  2×2 empty-state suggestions
    MessageItem.tsx      user bubble / assistant document-style + SourcesRow (gold chips)
    MessageContent.tsx   [cite:N] → gold ﴾١﴿ markers; toArabicDigits
    ReasoningSteps.tsx   "جارٍ العمل…" trust block, collapses to summary line
  reader/
    PdfPage.tsx          fake scanned page (paper texture, court header, gold highlight + pulse)
    SourcePanel.tsx      55vw split panel, RTL pager, "فتح في المكتبة"
    LibraryTree.tsx      collapsible practice-area tree + search/type filter
  workflow/
    WorkflowRunner.tsx   vertical step column, connector draw, upload/slot/generate steps
    DraftView.tsx        paper draft, gold-underlined fields, provenance popover + inline edit
  orb/
    VoiceOrb.tsx         the glass orb (only gradient in the app)
    VoiceMode.tsx        session overlay: transcript, controls, tap-to-talk pump
```

Routes: `/` assistant · `/cases`, `/cases/[id]` · `/workflows`,
`/workflows/[id]` · `/library` (`?doc=` deep link) · `/history`.

## 5. Conventions when extending

- Icons: lucide-react, `strokeWidth={1.5}`, never filled.
- No component library; compose from `components/ui.tsx` primitives.
- Data access ONLY via `import { api } from "@/lib/api"` — never import `/lib/data/*` in a component (see BACKEND-INTEGRATION.md).
- All user-facing strings are Arabic; ARIA labels in Arabic; Escape closes any popover/panel/overlay; Enter submits.
- RTL: use logical layout (`pr-`/`pl-` deliberately mirrored), previous-page chevron points **right**, next points **left**.
- Deep-linking into a scoped chat: push `/?case=<id>`, `/?doc=<id>`, optionally `&q=<question>` to auto-send.

# Law Firm Platform — Design System

**Purpose:** every component built for the agentic layer must feel like a natural extension of the shell and read as written by one hand. This doc is the visual constitution.

**Direction:** **monotone, like Legora.** Grayscale surfaces, a warm‑neutral near‑white canvas, and a single **near‑black** action color. Color is *functional, never decorative* — it appears only in small status icons, file‑type glyphs, and the one citation highlight. Arabic‑first, RTL by default.

**Reference points:** Legora (agent panel, plan cards, task lists, skills library) — see `ui refs/`. Note the flip from the previous version: the sidebar is **light/neutral**, not dark green, and the brand accent is **near‑black**, not green.

> **Token contract.** This doc uses the *same* CSS variable + Tailwind names already in the code, so nothing breaks. To restyle the whole app you change **values**, not names. See §12 for the exact mapping.

---

## 0. Design principles

1. **Restraint beats polish.** Lawyers distrust flash. White space, hairline borders, one action color. If a component looks "designed," strip it back.
2. **Monotone by default.** The interface is grayscale + near‑black. A splash of color is a *signal* (a done‑check, a file type, a flagged risk) — never a decoration. When in doubt, remove the hue.
3. **Arabic is the primary language.** RTL layout by default. Latin numerals are fine, but chrome must feel native‑Arabic, not translated.
4. **The Agent is a peer, not a mascot.** No emoji faces, no sparkle confetti. One quiet four‑point star marks the Agent identity; that's it.
5. **Every artifact is a document.** Task lists, timelines, memos — style them like real firm documents, not chat bubbles.
6. **Approve‑before‑act.** Every AI action shows a plan the lawyer approves. This is the deepest UX principle in the product, and the black **اعتماد الخطة** button is its visual anchor.

---

## 1. Color tokens

Monotone. One warm‑neutral gray ramp, a near‑black action color, and a tightly‑fenced set of functional colors. **Use CSS variables — never hardcode a hex in a component.**

```css
:root {
  /* ── Canvas & surfaces (warm‑neutral, desaturated) ── */
  --bg:            #F6F5F3;   /* app canvas — the off‑white behind everything */
  --surface:       #FFFFFF;   /* cards, panels, artifacts */
  --surface-2:     #F1F0ED;   /* input bg, hover wells, plan‑card body, chat bubble */
  --surface-3:     #E8E7E3;   /* sunken wells, dividers‑as‑fills, skeletons */
  --overlay-glass: rgba(247,246,244,0.72);  /* frosted floating panels / toasts */

  /* ── Borders ── */
  --border:        #E6E5E1;   /* hairline — the default 1px line */
  --border-strong: #D6D4CF;   /* inputs, secondary buttons, table rules */

  /* ── Ink (text) — neutral, near‑black ── */
  --text-primary:   #191919;  /* titles, body */
  --text-secondary: #6B6A67;  /* metadata, descriptions */
  --text-tertiary:  #9B9A96;  /* placeholders, timestamps, disabled */

  /* ── Accent = the monochrome signature (near‑black) ── */
  --accent:         #1A1A1A;  /* primary buttons, active nav, focus ring, agent star */
  --accent-hover:   #000000;  /* primary button hover */
  --accent-soft:    #EEEDEA;  /* active nav fill, selection, subtle chips — NEUTRAL gray */
  --accent-contrast:#FFFFFF;  /* text/icon on --accent */

  /* ── Functional highlight — the ONE permitted warm accent ── */
  /* Used ONLY for citation highlights in the document reader. Not a UI accent. */
  --gold:          #B8935A;
  --gold-soft:     rgba(184,147,90,0.14);

  /* ── Status — color lives in the ICON/DOT, not the pill ── */
  --status-done:    #3F8F5B;  /* منجز — green check */
  --status-review:  #B7863C;  /* قيد المراجعة — muted amber, sparing */
  --status-pending: #9B9A96;  /* قيد الانتظار — neutral */
  --danger:         #B4462E;  /* متوقف / waived — red, rare */

  /* ── Neutral pill surface (status pills, badges) ── */
  --pill-bg:        #F0EFEC;
  --pill-text:      #4A4A47;
}
```

### The color rules

- **No green or gold as a UI accent.** The old brand green is gone from buttons, nav, and links; those are now near‑black. Gold survives *only* as the citation highlight in the reader.
- **Status = neutral pill + colored icon.** Pills use `--pill-bg` / `--pill-text` (gray). The state is read from a small leading dot/icon tinted with `--status-*`. This matches Legora exactly (see `ui refs/` task list — "Done / Under Review / To be provided" are all gray pills; only the check is green).
- **File‑type icons keep their real brand colors** (Word blue, Excel green, PowerPoint orange, the yellow task‑list dot). This is the only place multi‑color is welcome — because it's *information*, not styling.
- **Never introduce a new color without adding it here first.** No teal, no purple, no blue accents beyond a file glyph.

> **Optional brand whisper (off by default).** If the partners want a trace of firm identity in the primary button, set `--accent: #14231D` (near‑black green) — it still reads monotone. Leave it `#1A1A1A` for the truest Legora look. One‑line swap, zero component changes.

---

## 2. Typography

```css
--font-sans:   "Inter", "IBM Plex Sans Arabic", system-ui, -apple-system, sans-serif;
--font-arabic: "IBM Plex Sans Arabic", "Cairo", "Inter", sans-serif;
--font-mono:   "JetBrains Mono", "SF Mono", ui-monospace, monospace;
```

Load `IBM Plex Sans Arabic` (weights 400, 500, 600) — closest to Legora's neutral grotesque with proper Arabic support.

**Scale** (rem):
- `--text-xs: 0.75rem`   → status pills, timestamps
- `--text-sm: 0.875rem`  → secondary UI, metadata
- `--text-base: 1rem`    → body, chat messages
- `--text-lg: 1.125rem`  → card titles, section headers
- `--text-xl: 1.5rem`    → page titles ("بمَ يمكنني مساعدتك؟")
- `--text-2xl: 2rem`     → hero states only

**Weights:** 400 (body), 500 (UI labels), 600 (titles). Never 700+ in chrome — reserve boldness for artifact content and hero headings (Legora sets big headings in a heavy weight, but *only* on marketing‑scale text).

**Line‑height:** 1.5–1.7 for Arabic body (Arabic needs breathing room), 1.3 for titles.

---

## 3. Spacing scale

4px base:
```
--space-1: 4px    --space-6: 24px
--space-2: 8px    --space-8: 32px
--space-3: 12px   --space-10: 40px
--space-4: 16px   --space-12: 48px
--space-5: 20px   --space-16: 64px
```

**Rule:** cards get `--space-5` (20px) internal padding, sections separate by `--space-8` (32px), major regions by `--space-12` (48px). Legora runs *generous* whitespace — when unsure, add space, not lines.

---

## 4. Radius & shadow

Legora is soft and rounded, with barely‑there shadows.

```css
--radius-sm: 8px;      /* pills, small chips */
--radius-md: 10px;     /* buttons, inputs */
--radius-lg: 14px;     /* cards */
--radius-xl: 20px;     /* plan card, panels, modals */

--shadow-xs: 0 1px 2px rgba(16,14,10,0.04);
--shadow-sm: 0 1px 3px rgba(16,14,10,0.05), 0 1px 2px rgba(16,14,10,0.04);
--shadow-md: 0 4px 16px rgba(16,14,10,0.06);
--shadow-lg: 0 12px 40px rgba(16,14,10,0.10);
```

**Rule:** always‑visible cards use `--shadow-xs` or nothing. Reserve `--shadow-md`+ for floating panels, toasts, and modals. Legora keeps shadows *very* subtle — a diffuse glow, not a drop. Prefer a hairline `--border` over a shadow to separate a card from the canvas.

---

## 5. Motion

Short, functional transitions. Nothing bouncy, nothing decorative.

```css
--ease: cubic-bezier(0.2, 0, 0.2, 1);
--duration-fast: 120ms;
--duration-med: 200ms;
--duration-slow: 320ms;
```

- Button hover: `120ms` bg/opacity
- Panel open/close: `200ms` translate + fade
- **Plan step check‑off: `320ms`** — the one place we allow visible motion, because it's the "wow." Empty circle → filled black/green check.
- Task‑list row appear: `stagger 40ms` per row

**No bouncy easings anywhere.** Legora is calm; match calm. Respect `prefers-reduced-motion` (already wired in `globals.css`).

---

## 6. Component patterns

### 6.1 Cards
```
bg: var(--surface)
border: 1px solid var(--border)
radius: var(--radius-lg)
padding: var(--space-5)
shadow: none (or --shadow-xs on hover)
```
No `translateY` lift on hover — feels startup‑y. Hover shifts bg to `--surface-2` at most.

### 6.2 Buttons

**Primary** (اعتماد الخطة / Run / Save) — the black CTA:
```
bg: var(--accent)              text: var(--accent-contrast)
radius: var(--radius-md)       padding: 10px 20px
font-weight: 500               hover: bg var(--accent-hover)
```

**Secondary** (عرض الخطة / Cancel):
```
bg: var(--surface)             border: 1px solid var(--border-strong)
text: var(--text-primary)      hover: bg var(--surface-2)
```

**Ghost** (icon buttons, subtle actions):
```
bg: transparent                hover: var(--surface-2)
```

**Round send button** (chat): a filled **black** circle with a white arrow (`↑`) or mic. This is Legora's signature input affordance — keep it black.

### 6.3 Input fields
Match the chat input: rounded (`--radius-xl` for the big composer, `--radius-md` for small fields), `--surface` or `--surface-2` fill, quiet `--border`, mic + attach + source/tools/skills chips inline. Focus gets a subtle 2px `--accent` ring at low emphasis (or a `--border-strong` ring). The composer sits on the canvas like a soft pill, not a boxed form.

### 6.4 Status pills — **neutral**
```
bg: var(--pill-bg)       text: var(--pill-text)
size: --text-xs          radius: var(--radius-sm)
```
No colored backgrounds. Convey state with a small leading dot/icon in `--status-*`:
- منجز → `--status-done` check
- قيد المراجعة → `--status-review` half‑circle
- قيد الانتظار → `--status-pending` dot
- متوقف → `--danger` ✕

### 6.5 Skill / suggestion cards
- `--surface`, `--border`, `--radius-lg`
- Leading icon (top‑right in RTL), muted `--text-secondary`
- Title `--text-base` weight 500; one‑line description `--text-sm --text-secondary`
- Hover: bg → `--surface-2`, no lift
- Click: opens the Agent with a pre‑filled prompt

### 6.6 Plan card — **the key component** (Legora "SPA Drafting Plan")
- Container: `--surface`, `--radius-xl`, `1px solid --border`, `--shadow-xs`
- Header row: small doc icon + plan title (weight 500) on one side, a subtle progress `12%` + download glyph on the other
- Body: a `--surface-2` well containing the goal paragraph in `--text-secondary`
- Todo list: each row = circle (empty `--border-strong` → filled `--status-done` check when executed) + label + optional inline tool badge (neutral pill)
- "+ N more todos" in `--text-tertiary`
- Footer: two buttons — **عرض الخطة** (secondary) + **اعتماد الخطة** (primary black). Full‑width split, side by side.
- Approved state: replace footer with a quiet "تم الاعتماد · جارٍ التنفيذ" + small spinner

### 6.7 Task list artifact (Legora task list)
A real document, not a chat bubble.
- Header: yellow‑dot icon + "قائمة المهام" + count meta
- Table: Title | Status | Assignee (RTL order reversed)
- Rows separated by `--border` rules, no full‑row backgrounds
- Status = **neutral pill + colored icon** (§6.4)
- Assignee: initials avatar (`--surface-2` circle, `--text-secondary`) + role (المحامي / الموكل)
- Checkbox toggles done inline — proves it's live, not a picture
- Footer: مشاركة مع الموكل (secondary) · تصدير (ghost)

---

## 7. RTL rules

- `dir="rtl"` on `<html>` and every artifact.
- Directional icons (arrows, chevrons) flip. Neutral icons (mic, attach, document, star) don't.
- Numbers, dates, English proper nouns stay LTR inside RTL flow — wrap in `<span dir="ltr">`.
- Progress bars fill right‑to‑left.
- Sidebar stays on the **right** in RTL — matches the current shell ✓.

---

## 8. Arabic microcopy conventions

Professional‑legal register. No informal Egyptian, no emoji, no exclamation marks.
- "بمَ يمكنني مساعدتك؟" (formal, warm)
- Nav: "المساعد / القضايا / الإجراءات / المهارات / المكتبة / السجل"

**Agent voice = senior associate:** precise, brief, willing to say "لا أعلم."

Approved terms:
| EN | AR |
|---|---|
| Agent | المساعد |
| Plan | الخطة |
| Approve plan | اعتماد الخطة |
| View plan | عرض الخطة |
| Task list | قائمة المهام |
| Case | قضية |
| Skill | مهارة |
| Workflow | سير عمل |
| Under review | قيد المراجعة |
| Client | الموكل |
| Lawyer | المحامي |

---

## 9. Iconography

**Lucide**, 1.5px stroke. 16px in pills/rows, 18–20px in headers/nav, 24px in empty states.

Approved:
- Agent identity: a single four‑point **star** (`sparkles`/star) — the only "sparkle," used once for the Agent
- Cases: `briefcase` · Skills/Procedures: `list-checks` / `git-branch` · Library: `book-open` · Log: `clock`
- Attach: `paperclip` · Mic: `mic` · Task done: `check-circle` · Task pending: `circle`
- Case source (Telegram): `send`
- **File‑type glyphs keep brand color** (Word blue, Excel green, PowerPoint orange, yellow task dot) — the sanctioned exception to monotone.

Never mix icon libraries. Never mix filled + outline in the same view.

---

## 10. What NOT to do (visual failure modes)

- ❌ Green or gold as a **UI** accent (buttons, nav, links, focus) — those are near‑black now. Gold = citation highlight only.
- ❌ Colored status‑pill backgrounds — pills are neutral; color goes in the icon.
- ❌ Gradients (except a whisper of canvas gradient, sparingly).
- ❌ Multi‑color icon sets (Notion‑style) — except real file‑type glyphs.
- ❌ Emoji as UI — the one exception is the yellow dot on the Task List title.
- ❌ Card lifts on hover (`translateY`) — feels startup‑y, not law‑firm.
- ❌ Any font other than Inter / IBM Plex Sans Arabic.
- ❌ Heavy shadows — prefer a hairline border.

---

## 11. Feel test

Before shipping any component: **would a senior partner at a serious Cairo firm feel this belongs on their desk?** If the answer is "cute" or "cool," strip it. If it's "quiet and competent," ship it. And one monotone check: **is every color on the screen carrying information?** If a hue is only there to look nice, remove it.

---

## 12. Token mapping (doc ⇄ code)

The doc names above are the live tokens. Tailwind aliases (see `tailwind.config.ts`):

| Purpose | CSS var | Tailwind |
|---|---|---|
| Canvas | `--bg` | `bg-bg` |
| Card surface | `--surface` | `bg-surface` |
| Muted well | `--surface-2` | `bg-surface-2` |
| Sunken | `--surface-3` | `bg-surface-3` |
| Hairline border | `--border` | `border-line` |
| Strong border | `--border-strong` | `border-line-strong` |
| Ink primary | `--text-primary` | `text-ink` |
| Ink secondary | `--text-secondary` | `text-ink-2` |
| Ink tertiary | `--text-tertiary` | `text-ink-3` |
| Accent (near‑black) | `--accent` | `bg-accent` / `text-accent` |
| Accent hover | `--accent-hover` | `bg-accent-hover` |
| Neutral soft fill | `--accent-soft` | `bg-accent-soft` |
| Citation highlight | `--gold` | `text-gold` |
| Danger | `--danger` | `text-danger` |

**To restyle the whole app, edit values in `app/globals.css` `:root` — not the names.** All existing components pick up the change for free.

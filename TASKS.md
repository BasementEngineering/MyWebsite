# Development Backlog — Jan Kettler Portfolio Site

## How to run autonomously

Open a Claude Code session in this repo with auto mode active (`/auto`). Pick the next unchecked task below and say:

> "Work on Task X.Y from TASKS.md. Do not touch other sections. Stop if you reach a decision point not covered by the acceptance criteria."

Run `next build` after each task to confirm nothing broke before moving on. Tasks marked **[PARALLEL]** can be worked simultaneously in a second worktree (`git worktree add ../site-branch-name -b branch-name`).

**Best starting point: Task 0.1** — the interaction redesign must happen before responsive work (1.x), since those tasks depend on knowing the final interaction model.

---

## Execution order

```
Sprint 0 (interaction redesign): 0.1
Sprint 1 (blocking):  1.1 → 1.2 → 1.3   +parallel: 2.1 → 2.2
Sprint 2 (structure): 4.1 → 4.2 → 4.3 → 4.4   +parallel: 3.1 → 3.2
Sprint 3 (media):     5.1 → 5.2
Sprint 4 (meta):      6.1
```

---

## Area 0 — 3D Scene Interaction Redesign

> P0 — The current autoplay + 600vh scroll lock is broken and must be replaced before any responsive or content work. **Blocks tasks 1.1–1.3.**

### Task 0.1 — Rework TechReveal + PhoneScene: scroll-reveal + click-to-explore

**Interaction model agreed:**
- Section is **100vh, sticky** while in viewport — no 600vh scroll runway, no scroll lock
- **Scroll-driven zoom-out**: as the section scrolls into view (0 → 1 of its viewport intersection), camera pulls back from close-up phone to full scene (replaces the old autoplay RAF animation)
- **Click-to-explore**: each major 3D object is individually clickable — camera flies to a focused position; click elsewhere or ESC resets to full view
- **Scroll past freely**: once the user has seen enough they just scroll past; no interaction required to proceed

**Acceptance criteria:**

- [x] `TechReveal.tsx`: remove the 600vh scroll runway, the RAF autoplay lock, and all `window.scrollTo` calls. Section becomes `min-h-screen` with a sticky inner container.
- [x] Scroll-reveal: use Framer Motion `useScroll({ target: sectionRef, offset: ['start end', 'start start'] })` to get a 0→1 progress as the section scrolls into the viewport. Map this progress to the camera zoom-out (phone close-up → full scene), replacing `CAM_START → CAM_END` logic that was previously driven by the 600vh runway progress.
- [x] The white flash overlay and "Substanz statt Hype." claim text are retained — they trigger during the scroll-reveal phase (progress ~0.2–0.5) as before, now driven by scroll position rather than RAF time.
- [x] Phase panels (left) and deployment stack + Azure (right) appear at the end of the scroll-reveal (progress ~0.7–1.0) — same objects, same animation values, now scroll-triggered.
- [x] **Click interactions** (new): each 3D mesh group (phone, each panel, VPS cube, Azure cube) has an `onClick` handler via React Three Fiber's event system. On click: camera smoothly lerps to a preset focus position for that object over ~600 ms. A small "×" or ESC key handler returns camera to the full-scene resting position.
- [x] Focus presets: phone → `(0, 0.1, 2.5)`, panels → `(finalX, 0, 2.0)` with matching lookAt, VPS → `(2.7, -0.9, 2.5)`, Azure → `(2.7, 1.9, 2.0)`.
- [x] Cursor changes to `pointer` on hover over clickable objects (`onPointerOver`/`onPointerOut` set `document.body.style.cursor`).
- [x] Reset button `× Übersicht` appears bottom-right when focus is active; ESC key also resets.
- [x] No scroll locking at any point. User can scroll past the section at any time.
- [x] `next build` passes clean.

**Key files:** `components/transition/TechReveal.tsx`, `components/transition/PhoneScene.tsx`

---

## Area 1 — Responsive 3D Scene

> P1 — These tasks are blocking. The 3D scene currently has no mobile handling and breaks below ~1200 px.

### Task 1.1 — `useMobileViewport` hook

- [ ] New file `hooks/useMobileViewport.ts` exports `useViewportPreset()` returning `{ isMobile, isTablet, cameraStart, cameraEnd, fov }`
- [ ] Breakpoints: mobile ≤ 640 px, tablet 641–1024 px, desktop > 1024 px
- [ ] Reads `window.innerWidth` on mount and on resize (debounce 120 ms)
- [ ] SSR-safe: guard with `typeof window !== 'undefined'`; returns desktop preset on server

**Key files:** `hooks/useMobileViewport.ts` (new)

---

### Task 1.2 — Per-breakpoint camera presets in PhoneScene

- [ ] `PhoneScene.tsx` consumes `useViewportPreset()` and passes camera values to `<Canvas>` + `CameraAnimation`
- [ ] Mobile (≤ 640 px): `CAM_START = (0, 0, 1.4)`, `CAM_END = (0, 0.4, 5.5)`, `fov = 52` — zooms to phone body only, panels intentionally fly off-screen
- [ ] Tablet (641–1024 px): `CAM_START = (0, 0, 1.8)`, `CAM_END = (0, 0.6, 8.0)`, `fov = 48`
- [ ] Desktop: existing values unchanged `(0,0,2.2) → (0,0.8,10.5)`, fov 45
- [ ] No console errors on window resize

**Key files:** `components/transition/PhoneScene.tsx`, `hooks/useMobileViewport.ts`

---

### Task 1.3 — Prevent 3D canvas overlap on small screens

- [ ] TechReveal reads viewport width; on mobile (≤ 640 px) section scroll-height shrinks from `600vh` to `320vh`
- [ ] Sticky container gets `isolation: isolate` and `overflow: hidden` so Three.js `<Html>` labels cannot leak outside canvas bounds
- [ ] Auto-play RAF animation duration scales proportionally to the scroll-height ratio (12 s on desktop → 6.4 s on mobile)
- [ ] `EngineeringSection` renders with no visual overlap at 390 px viewport width

**Key files:** `components/transition/TechReveal.tsx`, `components/transition/PhoneScene.tsx`

---

## Area 2 — Chatbot GDPR Opt-In

> P1 — The chat hits Azure AI on every message with no user notice. Legal exposure. Fix before any chat UI polish.

### Task 2.1 — `ConsentGate.tsx` component [PARALLEL with 1.x]

- [ ] New `components/engineering/ConsentGate.tsx` — full-width overlay inside chat container
- [ ] German copy: heading `Datenschutzhinweis`, body explains Azure AI (Microsoft) transmission, no server-side storage, withdraw by reloading
- [ ] `Zustimmen` button saves `jk_chat_consent=true` to localStorage; `Ablehnen` keeps overlay visible
- [ ] On mount: if localStorage already has `jk_chat_consent=true`, skip overlay entirely
- [ ] Matches parchment aesthetic: `background: rgba(242,240,233,0.97)`, 1 px border, JetBrains Mono

**Key files:** `components/engineering/ConsentGate.tsx` (new)

---

### Task 2.2 — Wire consent into TransparentArchitectChat

- [ ] `TransparentArchitectChat.tsx` wraps chat body with `ConsentGate`
- [ ] `send()` has early-return guard: does nothing if `localStorage.getItem('jk_chat_consent') !== 'true'`
- [ ] Header metrics bar remains visible above the gate (widget identity clear before consent)
- [ ] After granting consent: overlay fades out (200 ms opacity transition), chat becomes interactive without page reload

**Key files:** `components/engineering/TransparentArchitectChat.tsx`, `components/engineering/ConsentGate.tsx`

---

## Area 3 — Tokenizer View Redesign

> P2 — Parallel-safe after Task 2.1. Can run alongside Area 4.

### Task 3.1 — Token stream visual redesign

- [ ] Remove `<sub>#{b.id}</sub>` superscript from every token block
- [ ] Token blocks use pill shape: `border-radius: 2px`, `padding: 2px 6px`; background alternates between two near-identical parchment tints (`rgba(21,128,61,0.06)` / `rgba(21,128,61,0.03)`) based on even/odd index
- [ ] Streaming container: `max-height: 280px`, `overflow-y: auto`, smooth-scrolls to bottom on each new token (use existing `bottomRef` pattern)
- [ ] Streaming label replaced with pulsing green dot + `Generiert …` in 9 px monospace
- [ ] `cursor-blink` moves to right of last token block, not standalone child
- [ ] Completed messages render as plain flowing text (no token borders), matching existing chat bubble style

**Key files:** `components/engineering/TransparentArchitectChat.tsx`, `app/globals.css`

---

### Task 3.2 — Estimator bar and word prediction polish (P3)

- [ ] Estimator row hidden entirely when `input.trim().length === 0` (height collapses, no ghost text)
- [ ] Word-prediction chips: `background: rgba(0,0,0,0.04)` on hover, `cursor: pointer`, no layout jump on click
- [ ] Faint divider (`1px rgba(0,0,0,0.08)`) separates estimator row from prediction chips

**Key files:** `components/engineering/TransparentArchitectChat.tsx`

---

## Area 4 — Three-Persona Structure

> P2 — Build the section skeleton first (4.1), then add persona header (4.2), then fill content (4.3, 4.4).

### Task 4.1 — Page scaffold: render SpeakerSection + stub AIExpertSection

- [ ] `app/page.tsx` render order: `Nav → Hero → PersonaTriptych → NeuralExplode → TechReveal → EngineeringSection → AIExpertSection → SpeakerSection`
- [ ] `NeuralExplode` placed between Hero and TechReveal (was defined but never rendered)
- [ ] `AIExpertSection` is a minimal stub at `components/engineering/AIExpertSection.tsx`: parchment background, eyebrow `// AI Expert`, headline placeholder, `{/* TODO Task 4.3 */}` comment
- [ ] `SpeakerSection` nav anchor `#vortraege` resolves correctly
- [ ] `next build` passes with no TypeScript errors

**Key files:** `app/page.tsx`, `components/engineering/AIExpertSection.tsx` (new)

---

### Task 4.2 — `PersonaTriptych.tsx` — three-panel persona header

- [ ] New `components/surface/PersonaTriptych.tsx` with three equal-width panels: `Real Engineer`, `AI Expert`, `Science Communicator`
- [ ] Each panel: short persona label (bold, mono), one-line descriptor (font-sans light), thin bottom border as scroll anchor
- [ ] Desktop hover: active panel expands to ~40% width, others shrink to ~30% (CSS flex transition, 400 ms ease)
- [ ] Mobile: panels stack vertically, no hover effect
- [ ] White background, purely typographic — no icons, no gradients
- [ ] Inserted between Hero and NeuralExplode in `app/page.tsx`

**Key files:** `components/surface/PersonaTriptych.tsx` (new), `app/page.tsx`

---

### Task 4.3 — Fill AIExpertSection with real content

- [ ] Eyebrow `// AI Expert Layer`, headline `Von der Forschung in die Praxis.`
- [ ] Three wireframe cards (same grid as EngineeringSection): RAG & Retrieval (Azure AI Search), LLM Deployment (Azure AI Foundry / Phi-4-mini), AI Safety & Compliance
- [ ] Reuse `LiveDataWidget` in one card with AI metrics: `Latenz`, `Tokens/s`, `Kontextlänge`, `Kosten/Anfrage`
- [ ] All strings added to `lib/content.ts` under `aiExpert` key — no hardcoded copy in the component
- [ ] Parchment background and dot-grid matching EngineeringSection

**Key files:** `components/engineering/AIExpertSection.tsx`, `lib/content.ts`

---

### Task 4.4 — SpeakerSection content and talks list

- [ ] `lib/content.ts` speaker section gets a `talks` array: `{ title, venue, date, type: 'Keynote' | 'Science Slam' | 'Workshop' }[]`
- [ ] SpeakerSection renders talks in a bordered mono list below the three cards
- [ ] If `talks` array is empty the list renders nothing (no empty skeleton)
- [ ] Verify NeuralExplode scroll-height and sticky positioning works end-to-end before this section

**Key files:** `lib/content.ts`, `components/surface/SpeakerSection.tsx`

---

## Area 5 — Photos and Videos

> P2/P3 — Blocked on Area 4 scaffold existing. Media asset files must be dropped into `public/images/photos/` manually before running 5.1.

### Task 5.1 — Photo integration (P2)

- [ ] Establish `public/images/photos/` directory convention
- [ ] SpeakerSection: horizontal scrollable filmstrip below talks list — `display: flex`, `overflow-x: auto`, `gap: 12px`, each image `200 × 280 px` object-cover
- [ ] Filmstrip renders nothing if directory has no images (no broken `<img>` tags)
- [ ] Hero: if `public/images/photos/headshot.jpg` exists, render 48 px circular crop next to eyebrow line; if absent, Hero is unchanged
- [ ] All images use Next.js `<Image>` with `width`, `height`, `alt`

**Key files:** `components/surface/SpeakerSection.tsx`, `components/surface/Hero.tsx`

---

### Task 5.2 — Video embeds (P3)

- [ ] New `components/surface/VideoCard.tsx` accepting `{ title, embedUrl, thumbnail }`
- [ ] Click-to-play: iframe only injected into DOM after user click (prevents tracker preload)
- [ ] `lib/content.ts` speaker section gets a `videos` array (can be empty initially)
- [ ] SpeakerSection maps over `videos`, renders `VideoCard` in responsive grid (1 col mobile, 2 col desktop) above filmstrip
- [ ] Empty `videos` array → grid not rendered
- [ ] Privacy note under each embed: `// Videoinhalt wird von YouTube/Vimeo geladen.`

**Key files:** `components/surface/VideoCard.tsx` (new), `lib/content.ts`, `components/surface/SpeakerSection.tsx`

---

## Area 6 — Meta

> P3 — Helps future autonomous sessions orient faster.

### Task 6.1 — `CLAUDE.md` codebase guide

- [ ] Documents: tech stack, design tokens (parchment colours `#f2f0e9` / `#e8c878`, font variables, border conventions), section render order in `page.tsx`, `content.ts` single-source-of-truth pattern, `TokenUsage.txt` format, env var names (no values)
- [ ] Includes "Do not do" list: no SSR in canvas components, no raw `<img>`, no hardcoded strings outside `content.ts`, no `console.log` in production code
- [ ] One-liner per major component so a new session can orient without reading every file

**Key files:** `CLAUDE.md` (new)

---

## Priority summary

| Priority | Tasks |
|---|---|
| P1 — Do first | 1.1, 1.2, 1.3, 2.1, 2.2 |
| P2 — Core features | 3.1, 4.1, 4.2, 4.3, 4.4, 5.1 |
| P3 — Polish | 3.2, 5.2, 6.1 |

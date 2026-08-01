# Visual Style Reference

**Hybrid blend:** 70% Artisanal Portfolio Minimalism (Image 2) · 30% Top-Glow Gradient Concept (Image 1, gradient only)

**Document purpose:** Single source of truth for UI, extension panels, marketing pages, and component libraries derived from this hybrid aesthetic.

---

## Core Aesthetic

### **Soft Atelier Glow**

**Design philosophy:** *Calm, editorial clarity meets a whisper of warmth — structure through typography and space, emotion through watercolor softness and a single luminous gradient accent.*

**Key influences / hybrid styles identified:**

| Weight | Source | What carries over |
|--------|--------|-------------------|
| **70%** | Editorial portfolio minimalism (Fiona Feng) | Off-white canvas, serif/sans pairing, typographic hierarchy via weight + tone, watercolor bleed illustrations, asymmetric whitespace, hand-sketched micro-accents |
| **30%** | Playful tech popover (Discord-style modal) | **Gradient concept only:** top-edge candy-pink → white linear fade on contained UI surfaces (cards, popups, panels) — not applied to full-page backgrounds |

**Explicitly excluded from Image 1:** saturated blurple CTAs, avatar stacks, gaming imagery, centered modal copy blocks, full-width pill buttons, tooltip caret shapes (unless contextually required).

---

## Color Palette

**Total color count:** 12 core tokens (+ 2 gradient stops)

### Foundation (Image 2 — primary)

| Color name | Hex | Usage context |
|------------|-----|---------------|
| **Canvas Warm White** | `#FAFAF8` | Primary page background; warmer than pure white, reduces glare |
| **Surface Pure White** | `#FFFFFF` | Cards, panels, extension popup body — gradient terminus |
| **Ink Primary** | `#1A1A1A` | Headlines (strong serif words), primary labels |
| **Ink Secondary** | `#6B6B6B` | De-emphasized headline words, secondary nav |
| **Ink Tertiary** | `#A8A8A8` | Captions, metadata, disabled copy |
| **Lavender Mist** | `#C8CCD8` | Watercolor mountain washes, subtle dividers |
| **Periwinkle Wash** | `#B8BFD4` | Illustration mid-tones, soft background blobs |
| **Dusty Coral Sun** | `#E8A598` | Illustration accents, decorative circles, warm highlights |
| **Sketch Taupe** | `#8A7F78` | Hand-drawn line art, raccoon-style sketch strokes |
| **Signal Coral** | `#E85D4A` | Active nav dot, micro-indicators, alert accents (use sparingly) |

### Gradient accent (Image 1 — 30% contribution)

| Color name | Hex | Usage context |
|------------|-----|---------------|
| **Glow Pink (gradient start)** | `#FF85D1` | Top 0% stop — header glow on cards/panels only |
| **Glow Pink Soft (mid-stop)** | `#FFD4EC` | ~12% stop — eases transition before white |

### Functional (derived, not from source images)

| Color name | Hex | Usage context |
|------------|-----|---------------|
| **Trust Slate** | `#2D3748` | Body text in dense UI (extension reports, lists) |
| **Verificado Sage** | `#4A7C6F` | Success / “información correcta” badges |
| **Alert Clay** | `#C45C4A` | Error / “información falsa” — muted to match palette, not neon |

---

## Typography System

### Headline style

| Property | Specification |
|----------|---------------|
| **Family type** | High-contrast **transitional serif** — e.g. *Fraunces*, *Playfair Display*, *Libre Baskerville*, or *Cormorant Garamond* |
| **Weight** | 600–700 (Semibold/Bold) for anchor words; 400 for connective words |
| **Scale** | Hero: `clamp(2.5rem, 5vw, 4.5rem)` · Section: `2rem` · Card title: `1.25rem` |
| **Tracking** | `-0.02em` on large headlines |
| **Line height** | `1.05–1.15` (tight, editorial) |
| **Treatment** | **Typographic value gradient:** alternate word color `#1A1A1A` → `#6B6B6B` → `#A8A8A8` within a single headline block (Image 2 pattern) |

**Example hierarchy block:**
```
Designing          ← Ink Primary, weight 700
with strategy,     ← Ink Secondary, weight 400
building for       ← Ink Tertiary, weight 400
```

### Body / secondary text

| Property | Specification |
|----------|---------------|
| **Family type** | Geometric **humanist sans-serif** — e.g. *Inter*, *DM Sans*, *Plus Jakarta Sans* |
| **Weight** | 400 body · 500 labels · 600 UI emphasis |
| **Scale** | Body: `1rem` (16px) · Small: `0.875rem` · Micro: `0.75rem` |
| **Line height** | `1.6` body · `1.4` UI dense |
| **Color** | `#2D3748` body · `#6B6B6B` secondary |

### Hierarchy structure

1. **Display serif** — page/section intent (one per viewport)
2. **Sans semibold** — component titles, report section headers
3. **Sans regular** — paragraphs, claim text, sources
4. **Sans medium small caps or tracked uppercase** — category labels (`CORRECTA`, `FALSA`, `SIN EVIDENCIA`)

### Special considerations

- **Bilingual (ES primary):** Serif headlines work well in Spanish; ensure `font-feature-settings: "liga" 1`; avoid ultra-narrow serifs for accented characters (`á`, `ñ`, `ü`).
- **Monospace:** Use only for JSON/debug views — *JetBrains Mono* or *IBM Plex Mono* at `0.8125rem`, not in consumer-facing copy.
- **Source citations:** Sans italic, `#6B6B6B`, underline on hover → `#1A1A1A`.

---

## Key Design Elements

### Textures and treatments

- **Watercolor bleed (Image 2):** Illustrations and decorative blobs use soft, feathered edges — simulate with SVG filters, CSS `mask-image` radial gradients, or PNG assets with alpha bleed. No hard vector outlines on organic shapes.
- **Paper grain (optional, subtle):** `opacity: 0.03` noise overlay on `#FAFAF8` canvas only — never on gradient headers.
- **Top-glow gradient (Image 1 — 30%):** Applied exclusively to **contained surfaces**:

```css
.card-glow {
  background: linear-gradient(
    180deg,
    #FF85D1 0%,
    #FFD4EC 12%,
    #FFFFFF 22%,
    #FFFFFF 100%
  );
  border-radius: 16px;
}
```

- **Gradient rules:**
  - Height influence: top **18–25%** of component visual area fades to white
  - Never use on full-viewport backgrounds
  - Never stack multiple glow gradients in one viewport
  - Pair with soft shadow: `0 4px 24px rgba(26, 26, 26, 0.06)`

### Graphic elements (lines, shapes, annotations)

| Element | Specification |
|---------|---------------|
| **Corner radius** | Cards/panels: `16px` · Buttons: `12px` · Pills/badges: `999px` · Thumbnails: `12px` |
| **Sketch accents** | Pencil-line illustrations (1.5px stroke, `#8A7F78`, slight hand-drawn wobble) — max 1 per section |
| **Geometric sun/moon** | Flat circles, `#E8A598`, no stroke — optional section markers |
| **Mountain/wash shapes** | Low-opacity lavender blobs as section dividers, not literal charts |
| **Active indicator** | `6px` circle, `#E85D4A`, adjacent to nav label |
| **Dividers** | `1px solid #E8E8E4` — avoid heavy rules |

### Layout structure and grid system

| Breakpoint | Grid | Behavior |
|------------|------|----------|
| Desktop | 12-column, `max-width: 1200px`, gutters `24px` | Asymmetric: content left-weighted, illustration/decoration center-right |
| Tablet | 8-column | Stack asymmetric pairs vertically |
| Extension popup | Single column, `width: 360–400px`, padding `24px` | Centered text blocks acceptable here only |
| Side panel | `width: 380–420px`, full viewport height | Glow gradient on panel header zone only |

**Whitespace principles (Image 2 dominant):**

- Minimum `80px` top breathing room on hero sections
- Content occupies ~40–50% width; remainder is intentional empty canvas
- Vertical rhythm base unit: `8px` (spacing scale: 8, 16, 24, 32, 48, 64, 80)

### Unique stylistic choices

1. **Dual warmth system:** Environmental warmth from `#FAFAF8` + coral illustrations; UI warmth from pink glow gradient on entry points (popup, panel header).
2. **Editorial type fade:** Headlines recede word-by-word in color, not size — creates depth without animation.
3. **Contained playfulness:** Whimsy lives in illustration and gradient headers; body UI stays restrained and trustworthy (critical for fact-checking contexts).
4. **No blurple / no neon:** Primary actions use Ink Primary filled buttons or outlined ghost — not saturated platform blues from Image 1.

---

## Visual Concept

### Conceptual bridge

The hybrid merges **contemplative craft** (portfolio) with **approachable activation** (popover glow). Image 2 establishes trust, literacy, and calm authority. Image 1 contributes a single signal: *"something meaningful is happening here"* — without breaking the editorial tone.

```
┌─────────────────────────────────────────────┐
│  ░░ Glow Pink → White (top 20% only) ░░     │  ← Image 1 (30%)
├─────────────────────────────────────────────┤
│                                             │
│   Serif headline (value gradient)           │  ← Image 2 (70%)
│   Sans body                                 │
│              [watercolor illustration]      │
│                                             │
│   generous whitespace                       │
└─────────────────────────────────────────────┘
```

### Relationship between elements

| Layer | Role | Source |
|-------|------|--------|
| Canvas | Silent, warm ground | Image 2 |
| Glow header | Draws eye to interactive container | Image 1 |
| Serif display | States purpose, emotional tone | Image 2 |
| Sans content | Delivers verifiable information | Image 2 |
| Watercolor/sketch | Humanizes data-heavy UI | Image 2 |
| Coral dot / badge | Orientation, status | Image 2 |

### Ideal use cases

- **Truth Tracker extension popup** — glow gradient header + serif summary title + sans claim categories
- **Instagram side panel** — white body, glow only on panel top strip, editorial section headers
- **Landing / about page** — full Image 2 layout with glow reserved for signup or CTA card
- **Report cards** — white surface, optional faint glow on "Ver detalle" destination panel
- **Avoid:** gaming modals, avatar social proof rows, full-bleed pink backgrounds, Discord-style centered marketing blocks

---

## Guidelines

### Do

- Use `#FAFAF8` as default page background
- Apply pink glow gradient only to card/panel **headers** (top 18–25%)
- Pair serif headlines with sans body — never sans-only for hero moments
- Fade headline emphasis through **color steps**, not opacity hacks
- Keep illustrations soft-edged and low-contrast against canvas
- Use `#E85D4A` micro-accents at most once per component
- Maintain `16px` card radius for consistency across extension and web

### Don't

- Don't extend pink gradient to full page or full panel background
- Don't import Image 1's blurple (`#5865F2`) as primary CTA
- Don't center-align long-form report text (extension detail views) — left-align for readability
- Don't mix hard geometric icons with watercolor blobs in the same 120px zone
- Don't use more than **12 core colors** visible in one viewport
- Don't apply sketch strokes to data tables or source URL lists

### Contrasts and tensions (intentional)

| Tension | Resolution |
|---------|------------|
| Playful glow vs. serious fact-checking | Glow only on containers; content area stays neutral white |
| Editorial serif vs. scannable UI | Serif for titles; sans for claims, sources, timestamps |
| Organic watercolor vs. structured data | Illustrations in margins/headers; JSON/report body stays clean |
| Minimal whitespace vs. dense reports | Collapse sections accordion-style; preserve 24px internal padding |

### CSS custom properties (ready to paste)

```css
:root {
  /* Foundation */
  --color-canvas: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-ink-primary: #1A1A1A;
  --color-ink-secondary: #6B6B6B;
  --color-ink-tertiary: #A8A8A8;
  --color-lavender-mist: #C8CCD8;
  --color-dusty-coral: #E8A598;
  --color-signal-coral: #E85D4A;
  --color-body: #2D3748;

  /* Gradient (Image 1 concept) */
  --gradient-glow: linear-gradient(
    180deg,
    #FF85D1 0%,
    #FFD4EC 12%,
    #FFFFFF 22%,
    #FFFFFF 100%
  );

  /* Typography */
  --font-serif: "Fraunces", "Playfair Display", Georgia, serif;
  --font-sans: "DM Sans", "Inter", system-ui, sans-serif;

  /* Radius & shadow */
  --radius-card: 16px;
  --radius-button: 12px;
  --shadow-soft: 0 4px 24px rgba(26, 26, 26, 0.06);

  /* Spacing */
  --space-unit: 8px;
}
```

### What makes this hybrid distinctive

1. **Restrained luminosity** — one gradient gesture, not a colorful system
2. **Typographic depth without animation** — color-step hierarchy in serif display type
3. **Craft signaling** — watercolor/sketch proves human curation behind automated output
4. **Trust-first density** — playful elements never overlap evidentiary content
5. **Cross-surface consistency** — same glow + serif + sans logic from marketing page to Chrome extension popup

---

*Generated from hybrid analysis: Portfolio hero (Fiona Feng aesthetic, Image 2) + Popover gradient concept (Image 1).*

---
name: Quode
description: A coding playground with a patient AI mentor, set in a warm reading room.
colors:
  reading-room-cream: "#fdf3c4"
  vellum: "#fef7d4"
  bound-page: "#f9e9a8"
  aged-page: "#f0d97e"
  spine-thread: "#d9be65"
  gilt-edge: "#b5973d"
  ink: "#2b1f02"
  pencil: "#6b541a"
  faded-note: "#957c34"
  lectern-gold: "#ffd43b"
  open-page: "#ffe580"
  margin-marker: "#ff8c42"
  soft-marker: "#ffb07a"
  margin-red: "#b1352a"
  library-stamp: "#2c7a35"
  tannin: "#a36b08"
  closed-library: "#0b0b0f"
  velvet-shelf: "#15151b"
  reading-lamp-shadow: "#1c1c24"
  polished-oak: "#23232d"
  brass-inlay: "#2a2a35"
  brass-inlay-strong: "#3a3a47"
  lamp-lit-page: "#f4f4f5"
  margin-note: "#a1a1aa"
  pencil-whisper: "#71717a"
typography:
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
  code:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.margin-marker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.margin-marker}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pencil}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.bound-page}"
    textColor: "{colors.ink}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.pencil}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
  tab-active:
    backgroundColor: "{colors.bound-page}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.vellum}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.vellum}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.bound-page}"
    textColor: "{colors.pencil}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
    height: "22px"
---

# Design System: Quode

## 1. Overview

**Creative North Star: "The Reading Room"**

Quode is a warm reading room with a single lamp on. Tall windows let in late-afternoon light that saturates the cream paper, the bound page, the gilt edge of a shelf. The user is at a long table with their laptop open, a notebook beside them, and a patient mentor seated across the room who answers when asked and otherwise lets them read. The interface is the room around the work, not a control panel.

The system explicitly rejects the cluttered toolbars of Replit and the bubble-and-name-tag of generic AI chatbots. It does not perform features. It does not chase the user's attention. The Run button is the only loud voice in the room, and only because it has earned the right.

**Key Characteristics:**
- Cream paper backgrounds, warm brown ink, occasional gold for moments of attention
- One primary action surface (Run); all other controls are ghost-weight at rest
- Generous radii on everything (6 / 10 / 14px) — nothing looks cut from sheet metal
- Flat by default; elevation is reserved for the Run button and modal focus
- Typography pairs Geist Sans (UI) with Geist Mono (code) — both warm, both modern

## 2. Colors

The palette is a warm reading room saturated by late light: cream paper, brown ink, brass and gold accents. Dark mode is the same room after dusk with the reading lamp on — warm-tinted blacks, the lectern gold preserved as the wakeful color.

### Primary

- **Margin Marker** (`#ff8c42`): The only loud color on screen. Reserved for the Run button, primary action confirmations, the focus ring, and the small dot that marks "stdin has content." Earns its weight by being rare.
- **Lectern Gold** (`#ffd43b`): The brand color. Used in the dark-mode cursor, link/selection highlight, and the duck mascot's body. Never used as a background fill on more than a 24×24px surface.

### Secondary

- **Soft Marker** (`#ffb07a`): Hover state of Margin Marker. Also used as the streaming caret in chat.
- **Open Page** (`#ffe580`): Soft yellow glow behind hover states on duck-themed surfaces. Sparing.

### Neutral (Light Mode — The Reading Room by Day)

- **Reading Room Cream** (`#fdf3c4`): App background. The paper of the room.
- **Vellum** (`#fef7d4`): Panel chrome, drawer backgrounds, header surface. One shade warmer than the base, so panels lift gently.
- **Bound Page** (`#f9e9a8`): Hover and active backgrounds for ghost controls; user chat bubble fill; resting tab background when active.
- **Aged Page** (`#f0d97e`): Pressed / strong-hover background. Rare.
- **Spine Thread** (`#d9be65`): Default border. Light enough to whisper, defined enough to anchor a card.
- **Gilt Edge** (`#b5973d`): Strong border (focus, raised cards, hovered scrollbar).
- **Ink** (`#2b1f02`): Primary text. Warm brown, not black.
- **Pencil** (`#6b541a`): Muted text — secondary labels, meta lines, ghost button rest state.
- **Faded Note** (`#957c34`): Subtle text — uppercase labels, line counts, "thinking…" placeholder.

### Neutral (Dark Mode — The Reading Room by Lamp)

- **Closed Library** (`#0b0b0f`): App background. Almost black, faintly warm.
- **Velvet Shelf** (`#15151b`): Panel chrome, drawer backgrounds.
- **Reading Lamp Shadow** (`#1c1c24`): Hover and active backgrounds.
- **Polished Oak** (`#23232d`): Pressed state, raised surfaces.
- **Brass Inlay** (`#2a2a35`): Default border.
- **Brass Inlay (Strong)** (`#3a3a47`): Focus, raised cards.
- **Lamp-lit Page** (`#f4f4f5`): Primary text.
- **Margin Note** (`#a1a1aa`): Muted text.
- **Pencil Whisper** (`#71717a`): Subtle text.

### Semantic

- **Margin Red** (`#b1352a` / dark `#ef4444`): Error states, nonzero exit codes.
- **Library Stamp** (`#2c7a35` / dark `#22c55e`): Successful runs (exit 0).
- **Tannin** (`#a36b08` / dark `#f59e0b`): Warnings, rate-limit notices.

### Named Rules

**The One Loud Voice Rule.** Margin Marker (`#ff8c42`) appears in at most one surface on screen — the Run button — plus the optional 6×6px dot that indicates stdin content. Any other use of orange is a mistake. The whole product's intensity rides on that single button feeling earned.

**The Warm Black Rule.** Black is forbidden. Where pure black would normally appear (text, dark-mode background, code editor background), use the tinted neutrals listed above. The reading room is never sterile.

**The Selection-as-Brand Rule.** Light mode selection is Margin Marker. Dark mode selection is Lectern Gold. The user's act of selecting text is the moment the brand greets them most directly.

## 3. Typography

**Display Font:** Geist (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Body Font:** Geist (same family — single-font discipline)
**Code Font:** Geist Mono (with `ui-monospace, monospace` fallback)

**Character:** Geist is the warmest of the modern geometric sans-serifs — open apertures, slightly humanist proportions, a quietly confident voice. Pairing it with Geist Mono keeps the room single-toned: the prose and the code speak the same dialect.

### Hierarchy

- **Title** (Geist 600, 15px / 1.2, letter-spacing -0.01em): Panel headers ("Duck", "Output"), Quode wordmark. Quiet headings, not display.
- **Body** (Geist 400, 14px / 1.55): Chat messages, button labels, prose throughout. OpenType features `cv02 cv03 cv04 cv11` enabled for a slightly more humanist g/i/l/y. Max line length 75ch in chat.
- **Label** (Geist 500, 10px / 1, letter-spacing 0.06em, uppercase): Section captions ("TRY ASKING"), runner badges, file meta. Sparse — never decoration.
- **Code** (Geist Mono 400, 13px / 1.55): Monaco editor, inline code, stdin textarea, output body. Fixed.

### Named Rules

**The Single-Family Rule.** Two fonts only: Geist for UI, Geist Mono for code. No third font for headers, no system fallback for branded copy, no Inter for "neutrality." The pairing is the whole voice.

**The No-Display-Size Rule.** Nothing larger than 15px in normal app chrome. Headers earn weight, not size. The user came here to read 13–14px code, not to read brand typography.

## 4. Elevation

Quode is flat by default. Depth comes from tonal layering — Vellum lifts from Reading Room Cream by being one tonal step warmer, panels lift from base by border alone, the drawer lifts by backdrop blur. Shadows are reserved for one element: the Run button.

The dark-mode reading lamp adds a single ambient radial gradient behind the body, suggesting light from above-right. That gradient is the elevation system at the page level.

### Shadow Vocabulary

- **Action Glow** (`box-shadow: 0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 14px -4px rgba(255,140,66,0.55)`): The Run button only. Inset highlight + warm halo. Hover brightens by 5%; active dims by 5%.
- **Backdrop Blur** (`backdrop-filter: blur(8px)` on `bg-base/80`): Sticky header and output drawer. Lets the page's ambient gradient bleed through.

### Named Rules

**The Flat Reading Surface Rule.** Cards, panels, drawers, tabs, inputs, and ghost buttons are flat. They use background tint and border, never `box-shadow`. The only element with a real shadow in the entire app is the Run button — and that shadow is what tells the user it is the primary action.

**The No-Floating-Cards Rule.** No element hovers above the page with a generic drop shadow. If something needs to feel raised, raise it with tonal layering (one step warmer surface) and a defined border. Never with a soft gray shadow under it.

## 5. Components

### Buttons

- **Shape:** Generously rounded (10px / `--radius-md`). No pill-shaped buttons except chips.
- **Primary (Run):** Margin Marker background, Ink text, Action Glow shadow, 32px tall, 13px label. The only filled button in the product. Includes a `⌘↵` kbd hint on `sm+`.
- **Ghost (Language, Input, Theme, Tab close):** Transparent at rest with Pencil text. On hover, fades to Bound Page background with Ink text. 32px tall, 10–12px horizontal padding. Used for every secondary action.
- **Hover / Focus:** Background tint transition (120ms ease-out). Focus-visible adds a 2px Margin Marker outline with 2px offset.

### Tabs

- **Shape:** 28px tall, 10px radius, sit inline within the header bar.
- **State:** Active tab is filled with Bound Page; inactive is transparent. No bottom underline, no file icon. The fill is sufficient signal.
- **Affordances:** Double-click to rename in place (input matches tab body inline, no popover). Middle-click closes. Close (×) is visible only on hover, except on the active tab where it stays.

### Inputs / Fields

- **Style:** Vellum background, Spine Thread border, 10px radius, 12px padding. The stdin textarea breaks this rule — it has no border, blends into the drawer surface, because it is meant to feel like a margin note.
- **Focus:** 2px Margin Marker outline with 2px offset. No glow, no border-color shift.
- **Disabled:** 60% opacity, cursor `not-allowed`. No grayscale.

### Cards / Panels

- **Shape:** Soft-rounded edges (14px / `--radius-lg`) on outer cards; inner surfaces inherit the 10px scale.
- **Background:** Vellum lifted one tonal step from the page.
- **Border:** Single 1px Spine Thread, full perimeter. Never one-sided.
- **Internal Padding:** 16px (lg) for content cards, 12px (md) for dense controls.

### Chips

- **Shape:** Pill (`999px` radius), 22px tall.
- **Style:** Bound Page background, Pencil text. Used sparingly — runner badge in the output header, suggestion buttons in Duck's empty state.

### Navigation (Header Bar)

- **Style:** 56px tall (`h-14`), sticky, semi-transparent Base with 8px backdrop blur, single Spine Thread bottom border. Grid: brand left, primary actions center, theme right.
- **Density:** No more than five interactive elements live in the header at any time. The fifth element is the threshold of clutter.

### Signature Component — The Duck Mascot

- **Style:** Small inline SVG, 26px in the panel header, 84px in the empty state. Body fill is Lectern Gold. Two states: `idle` (still) and `speaking` (gentle bob — 200ms ease-out, 6px translateY, reverse).
- **Rule:** Duck appears in exactly three places: the empty state, the panel header (only when there are messages), and the favicon. It does not appear next to individual chat messages. The mentor is in the room, not in every paragraph.

## 6. Do's and Don'ts

### Do:

- **Do** use Margin Marker (`#ff8c42`) exclusively for the Run button and the stdin-content dot. The intensity of the whole product rides on its rarity.
- **Do** layer surfaces tonally — Reading Room Cream → Vellum → Bound Page — to suggest depth without shadows.
- **Do** keep every neutral warm-tinted. Black is forbidden; pure white is forbidden.
- **Do** size text quietly. Geist 14px body, 15px title, 10px uppercase label. Nothing larger in app chrome.
- **Do** use the 6 / 10 / 14 / 999 radius scale consistently. Inputs and ghost buttons share 10px; cards take 14px; chips and the duck mascot take pill.
- **Do** keep no more than five interactive controls in the header bar.
- **Do** let typography and surface tint carry the visual hierarchy — not shadows, not gradients, not borders thicker than 1px.
- **Do** respect `prefers-reduced-motion`: the existing override already drops animation to 0.01ms; preserve it on every new component.

### Don't:

- **Don't** make the UI look like Replit. No toolbars on every edge, no file tree, no badge wall, no settings cog parade. Five header controls maximum.
- **Don't** make Duck look like a generic AI chatbot. No "Duck is typing…" bubble, no model name badge, no token meter, no avatar circle next to every message. The duck appears at the empty state and in the panel header only.
- **Don't** use pure black (`#000`) or pure white (`#fff`) anywhere. Every neutral leans warm.
- **Don't** use `box-shadow` on cards, tabs, panels, drawers, or any secondary surface. Shadow belongs to the Run button alone.
- **Don't** use side-stripe borders (`border-left` ≥ 2px as a colored accent). Banned at the system level — no callouts, no list items, no message decoration.
- **Don't** use gradient text. Never. Quode's hierarchy is solid-color + weight + size.
- **Don't** stack rounded corners that fight (e.g. a 14px card containing a 16px input). Inner surfaces should take a smaller radius than their container.
- **Don't** decorate uppercase labels with icons unless the icon adds real information. Sparkles next to "TRY ASKING" is the maximum allowed flourish.
- **Don't** introduce a second mono font for "design flavor." Geist Mono is the only mono.
- **Don't** size anything in the header above 15px. The user came for the code, not for the chrome.

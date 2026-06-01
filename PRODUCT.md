# Product

## Register

product

## Users

Self-directed learners and developers who write code in a browser to think, prototype, or practice. They arrive with a question or a half-formed idea, not a project plan. They are sitting at a laptop, usually alone, often in the evening or between other tasks. They want a clean surface to write code in and a patient voice to think out loud with when they get stuck.

The primary task on any screen: write code, run it, ask Duck about it.

## Product Purpose

Quode is a coding playground with a built-in AI mentor (Duck). It exists because most "AI + code" tools either dump full solutions on the user (training-wheels removed) or wrap a chatbot around a code box (no real teaching loop). Quode's job is to keep the user's hands on the keyboard while Duck nudges, explains, and critiques on demand — never auto-solving.

Success looks like: the user closes the tab having written code themselves, understanding it better than when they opened it.

## Brand Personality

Warm, considered, encouraging. A studious friend, not a co-pilot.

- **Warm** — comfortable, low-stakes, never antiseptic. The light theme leans cream, not white.
- **Considered** — every surface has been edited down. Nothing is there by reflex.
- **Encouraging** — Duck's voice is plainspoken and patient. Praise is sparing and specific; the user always feels they did the thinking.

Tone is closer to a senior who pairs with you over coffee than to a productivity app. Playful at the edges (the duck), serious at the core (the code).

## Anti-references

- **Replit** — toolbars on every edge, badges, panels, file trees, settings cogs. Quode rejects the "every feature deserves a button" reflex.
- **Generic AI chatbot UI** — bubble + textarea + token counter, with the model's name front and centre. Duck is a presence in a workspace, not the workspace itself.
- **Marketing-y code playgrounds (CodePen-style)** — bright colors, big logos, gallery of "templates." Quode is a private desk, not a showcase.
- **VS Code** — too dense for a 10-minute thought. The status bar, activity bar, problems panel, terminal tabs are all wrong defaults for a playground.

## Design Principles

1. **The code is the content.** Everything around the editor is framing. Chrome earns its space; when in doubt, remove it.
2. **One primary action per screen.** Run is the heartbeat. Secondary controls do not compete on weight, color, or motion.
3. **Mentor presence, not mascot performance.** Duck's warmth shows up in copy, micro-motion, and an occasional visual cue, never in oversized illustrations or branded chrome.
4. **Precision under warmth.** Resting state is soft (cream surfaces, generous radii, calm motion). Interactive state is sharp (keyboard parity, fast feedback, no spinners over 200ms without context).
5. **Teach by restraint.** Fewer modes, fewer toggles, fewer settings. If we can read intent from the user's own input, we do — we don't make them pre-classify it.

## Accessibility & Inclusion

Target: WCAG 2.1 AA.

- All interactive controls reachable by keyboard with visible focus rings (brand-tinted, ≥2px).
- Color contrast ≥4.5:1 for text, ≥3:1 for UI states. Never communicate state through color alone — pair with icon or label.
- Respect `prefers-reduced-motion`; reduce animation duration and disable layout-shifting transitions when set.
- Editor (Monaco) inherits the system theme; remote users on screen readers can still operate Run, tabs, and Duck via standard ARIA roles.

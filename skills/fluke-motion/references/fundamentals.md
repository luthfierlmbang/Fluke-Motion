# Motion Fundamentals — Taxonomy, Principles, Easing & Duration

Reference for the fluke-motion skill. Read this when writing specs, choosing easing/duration values, or explaining *why* a motion choice is right.

## Table of contents
1. [Taxonomy of UI motion](#1-taxonomy-of-ui-motion)
2. [Animation principles for UI](#2-animation-principles-for-ui)
3. [Easing: rules and standard curves](#3-easing-rules-and-standard-curves)
4. [Duration: concrete values](#4-duration-concrete-values)
5. [Material & Apple system values](#5-material--apple-system-values)
6. [Universal rules](#6-universal-rules)

---

## 1. Taxonomy of UI motion

Every animation should belong to one of these purposes. If it doesn't fit any, question whether it should exist.

**By purpose (Rachel Nabors, *Animation at Work*):**
- **Transitions** — move users between places/tasks (view changes, routing)
- **Supplements** — bring info on/off without changing location (toasts, badges, panels)
- **Feedback** — connect user input to interface reaction (press states, validation shake)
- **Demonstrations** — show how something works (onboarding, animated tutorials)
- **Decorations** — convey no information; purely aesthetic. Highest-risk, lowest-value category — use most sparingly.

**By type (practical product-design vocabulary):**
- **Micro-interactions** — single-action animations (toggle, like-burst, checkbox). Structure (Dan Saffer): trigger → rules → feedback → loops & modes.
- **State/feedback** — hover, pressed, focus, disabled, success, error. Press feedback at ~100ms feels like direct physical manipulation.
- **Navigational/spatial transitions** — preserve context across view changes; communicate where the user came from and is going.
- **Loading & progress** — spinners, progress bars, skeleton screens. Skeletons beat spinners for content loads >1s.
- **Attention-seeking** — pulses, shakes, badge bounces. Highest annoyance risk: the more frequent, the subtler and shorter it must be.
- **Brand/hero motion** — signature moments, animated logos, celebrations. Motion is brand voice; codify it.
- **Ambient/decorative** — background loops, gradient drift. Must be subtle, respect reduced-motion, pause when off-screen.
- **Value change** — animate numbers/charts so data reads as dynamic and manipulable.

**Realtime vs non-realtime (Willenskomer):** realtime = motion driven directly by user manipulation (drag, scrub — object tracks input 1:1, zero added duration). Non-realtime = plays *after* input, briefly locks the user out — keep short. Prefer realtime/interruptible whenever the user is touching the UI.

## 2. Animation principles for UI

The Disney principles that actually matter for interfaces:

| Principle | UI meaning | Concrete use |
|---|---|---|
| **Easing** (slow in/out) | The single most important. Linear positional motion reads robotic/broken. | Every movement gets a curve — see §3 |
| **Timing** | Duration carries meaning: fast = light/small, slow = large/heavy | See §4 |
| **Anticipation** | Prepare users before the change | Hover states, press-compression before action, drawer peek |
| **Follow-through & overlap** | Related items move at slight offsets — creates hierarchy and polish | Staggered lists (20–25ms offsets), content trailing its container |
| **Staging** | One thing commands attention at a time | Dim background when dialog enters; animate the CTA, keep the rest still |
| **Secondary action** | Supporting animation reinforcing the primary | Ripple from tap, confetti on success — basis of all micro-interactions |
| **Squash & stretch** | Weight and tactility — sparingly in productivity UI | Button compresses 2–5% on press; pull-to-refresh elastic |

Situational: **arcs** (curved paths feel organic — dock magnification), **exaggeration** (amplify just past realistic for legibility — error shake), **solid drawing** (shadows/perspective/scale must obey one coherent spatial model).

**The 12 UX-in-Motion principles (Willenskomer)** — usability-first framing; motion supports expectation, continuity, narrative, relationship:
easing · offset & delay (stagger = pre-cognitive hierarchy) · parenting (linked properties = "these are connected") · transformation (button → spinner → checkmark chunks states into one narrative) · value change · masking · overlay (motion communicates z-order) · cloning (new objects visibly originate from existing ones = unambiguous causation) · obscuration (blur/frost orients toward layers behind) · parallax (scroll-rate difference = depth hierarchy) · dimensionality (fold/card/3D gives spatial origin) · dolly & zoom (camera-style travel between hierarchy levels).

## 3. Easing: rules and standard curves

### Usage rules (industry consensus)
- **Ease-out** — the default for UI. Entrances, anything user-triggered (starts instantly = feels responsive), hovers, expansions.
- **Ease-in** — exits/dismissals ONLY (accelerates away). Never for entrances — sluggish start reads as lag.
- **Ease-in-out** — on-screen A→B moves, reordering, carousels, morphs where both endpoints stay visible.
- **Linear** — only for: spinners/continuous rotation, indeterminate progress, and *properties of light* (opacity, color, brightness — linear gives the most even blend).
- Avoid CSS keyword `ease` for polished work — too mild to convey character. Use custom cubic-beziers.
- Easing = brand personality: snappy/bouncy reads energetic; gentle symmetric reads calm. Codify curves as design tokens.

### Workhorse curves
| Name | cubic-bezier | Use |
|---|---|---|
| **expo-out** | `(0.16, 1, 0.3, 1)` | The modern "premium/snappy" default — sheets, overlays, hero entrances |
| **back-out** (overshoot) | `(0.34, 1.56, 0.64, 1)` | Cheap "spring" — modals/cards that settle with personality |
| Material standard | `(0.4, 0, 0.2, 1)` | Classic all-purpose asymmetric ease-in-out |
| Material emphasized-decelerate | `(0.05, 0.7, 0.1, 1)` | Stylized entrances |
| Material emphasized-accelerate | `(0.3, 0, 0.8, 0.15)` | Stylized exits |
| quint-out | `(0.22, 1, 0.36, 1)` | Snappy but softer than expo |
| cubic-out | `(0.33, 1, 0.68, 1)` | Subtle, unobtrusive |

Aggressiveness scale for ease-out: sine < quad < cubic < quart < quint < expo. Further right = snappier/"more designed"; further left = subtler.

**Elastic and bounce have no cubic-bezier equivalent** (they cross the target multiple times) — need keyframes, JS springs (Framer Motion/GSAP), CSS `linear()`, or platform springs.

**Spring vs bezier:** beziers are fixed-duration and break when interrupted; springs are velocity-continuous and interruptible. Use springs for gesture-driven/spatial motion, beziers for fire-and-forget transitions, linear for effects (opacity/color).

## 4. Duration: concrete values

Cheat table (synthesis of NN/g, Val Head, Material, web.dev):

| Animation | Duration | Easing |
|---|---|---|
| Hover/pressed state, color/opacity change | 100–150ms | linear (light properties) or ease-out |
| Checkbox, toggle, small control | 100–200ms | ease-out |
| Tooltip, dropdown, menu | 150–250ms | ease-out in; faster fade out |
| Modal/dialog/sheet enter | 250–300ms | emphasized-decelerate or expo-out |
| Modal exit | 150–250ms (~20–30% faster than enter) | accelerate or fast fade |
| Page/route/full-screen transition | 300–500ms (desktop 150–300ms) | standard/emphasized |
| On-screen reposition (A→B) | 200–400ms | ease-in-out |
| Spinner/indeterminate | continuous, ~1s/rev | linear |
| Celebratory/hero/bounce | 500–1200ms | spring or back-out; sparingly |
| List stagger offset | 20–25ms per item | children ease-out |

Anchor facts:
- **0.1s** perceived as instant; **1s** = limit of uninterrupted thought (Nielsen) — functional motion stays well under 1s.
- Average visual perception ≈ **230ms** — below ~200ms motion isn't consciously perceived (fine for feedback, useless for communication).
- **>400–500ms functional motion feels like a drag** (NN/g).
- Bounce/elastic curves need **800–1200ms** to read — which is why they're rarely right for functional UI.
- Platform scaling (Material): tablet +30%, watch −30%, desktop 150–200ms standard (desktops expect snappier).
- Bigger element / longer travel → longer duration, but **sublinearly** — increase velocity, not just time.

## 5. Material & Apple system values

**Material M3 duration tokens:** short 50/100/150/200ms (small components) · medium 250/300/350/400ms (bottom sheets, larger moves) · long 450/500/550/600ms (full-screen) · extra-long 700–1000ms (ambient/hero).

**M3 transition patterns** — the standard vocabulary for choosing a transition:
| Pattern | Relationship | Defaults |
|---|---|---|
| **Container transform** | One element *is* another (list item → detail, FAB → toolbar) | 300ms in / 250ms back |
| **Shared axis** (X/Y/Z) | Spatial/navigational relation (tabs, steps, hierarchy) | 300ms |
| **Fade through** | No strong relationship (bottom-nav switches) — out-fade then in-fade + scale 92→100% | 300ms |
| **Fade** | Enter/exit in place (dialogs, menus, snackbars) | 150ms in / 75ms out |

Decision tree: persistent container? → container transform. Spatial relation? → shared axis. No relation? → fade through. In-place? → fade.

**M3 Expressive springs** (damping/stiffness): fast spatial 0.9/1400 (buttons, switches) · default spatial 0.9/700 (sheets, drawers) · slow spatial 0.9/300 (full-screen) · effects variants critically damped (1.0) — **never bounce opacity or color**, only position/scale may bounce.

**Apple HIG / Fluid Interfaces:**
- Motion must be purposeful: status, feedback, learning, orientation. Don't animate frequent interactions.
- Everything responds instantly to touch; animations are **interruptible and redirectable** — never lock the user out.
- Transfer gesture velocity into the animation (this is why Apple uses springs).
- Spring params (SwiftUI): perceptual **duration** + **bounce**. Bounce 0 = smooth, ~0.15 = brisk tail, ~0.3 = noticeably bouncy, **>0.4 = avoid** for UI. Default: 0.55s, bounce 0. Pick duration first, then tune bounce.
- Reduce Motion: substitute crossfades/color shifts for movement, scale, and z-effects — don't just delete meaningful transitions.

## 6. Universal rules

1. **Exits faster than entrances** (~20–30% faster) — departing elements no longer need attention.
2. **Decelerate in, accelerate out; ease-in-out across; linear only for light and rotation.**
3. **Higher frequency → shorter and subtler** — or no animation at all.
4. **Never exceed ~500ms for functional motion.**
5. **Stagger children 20–25ms**; total sequence still completes within the normal envelope.
6. **Animate only transform and opacity** where possible (compositor-only = cheap).
7. **Always honor `prefers-reduced-motion`** — replace movement with crossfades, don't remove meaning.
8. **Springs for gesture-driven motion, beziers for fire-and-forget, linear for light.**

## Sources
Material M3 motion (m3.material.io/styles/motion) · Apple HIG Motion + WWDC18 "Designing Fluid Interfaces" + WWDC23 "Animate with springs" · NN/g "Executing UX Animations" · Val Head "How fast should your UI animations be?" · Willenskomer "UX in Motion Manifesto" · Rachel Nabors "Animation at Work" · web.dev "The Basics of Easing" · easings.net · Taras Skytskyi "Ultimate Guide to Proper Use of Animation in UX"

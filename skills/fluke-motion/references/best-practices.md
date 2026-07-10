# Motion Best Practices — Do's/Don'ts, Accessibility, Performance

Reference for the fluke-motion skill. Read this when critiquing motion, writing production-ready prototypes, or when accessibility/performance questions come up.

## Table of contents
1. [The purpose test](#1-the-purpose-test)
2. [Do's and don'ts](#2-dos-and-donts)
3. [Anti-patterns](#3-anti-patterns)
4. [Accessibility](#4-accessibility)
5. [Performance](#5-performance)
6. [When NOT to animate](#6-when-not-to-animate)

---

## 1. The purpose test

Animation is legitimate for exactly four purposes (NN/g). If a motion serves none of these, cut it:
1. **Feedback on user actions** — confirm input registered; overcome change blindness
2. **State-change communication** — mode transitions, loading, system status
3. **Spatial navigation & hierarchy** — zoom = movement within hierarchy, slide = progression; keeps users oriented
4. **Signifier enhancement** — direction of motion signals interaction method (card slides up = dismiss by pulling down)

"Delight" alone is not a purpose — it decays with repetition. Decoration is the highest-risk, lowest-value motion category.

Pre-animation checklist: (1) Where is user attention now? (2) Goal — attract attention, show continuity, or indicate relationship? (3) How frequently will this be encountered? (4) User-triggered or indirect?

## 2. Do's and don'ts

**Do:**
- Begin the response within **100ms** of user input — the *start* of the transition is the feedback, even if the full animation runs longer.
- Make exits faster than entrances (~20–30%); ease-out in, ease-in out.
- Make animations **interruptible** — accept new state mid-flight, retarget smoothly. CSS transitions are inherently interruptible; springs retarget with preserved velocity; restarted fixed tweens are the failure mode.
- Match transform-origin to the trigger: a popover opening from a button scales from `bottom center`, not default `center` — origin mismatch breaks causality.
- Scale duration/subtlety inversely with frequency: the more often seen, the shorter and subtler.
- Apply gesture deltas immediately (1:1 tracking while finger is down; easing belongs to release only).
- Test small timing variations — 250ms vs 300ms "can feel very different."
- Codify duration + easing as design tokens for product-wide cohesion.

**Don't:**
- Animate critical content (logo, headline, primary CTA) — animated areas read as ads (banner blindness) and hypnotic motion makes info harder to absorb.
- Run multiple competing animations at once — they cancel each other's attention.
- Animate keyboard-initiated/high-frequency actions (command palettes, context menus) — Raycast has zero animation by design; macOS context menus open instantly.
- Block input during animation or make animation an imposed delay.
- Use motion as the only channel for important information.
- Use time-filling transitions during loading — increases perceived latency.

## 3. Anti-patterns

1. **Overly long durations** — >400–500ms standard UI reads as lag; Emil Kowalski: >300ms usually too long, a 180ms dropdown feels more responsive than 400ms.
2. **Animating everything** — ration motion in the design system.
3. **Motion without purpose** — fails the four-purpose test.
4. **Uninterruptible animation** — user forced to wait mid-flight.
5. **Easing mismatch** — linear for spatial movement (robotic); ease-in on entrances (feels laggy); no product-wide easing convention (incohesive).
6. **Wrong transform-origin** — element appears from nowhere instead of its trigger.
7. **Layout-thrash jank** — animating top/left/width/height/margin/padding; interleaved DOM reads/writes.
8. **`will-change` everywhere / `translateZ(0)` sprinkling** — GPU memory blowup, layer explosion, worse performance.
9. **Scroll-jacking, forced parallax, autoplay carousels** — vestibular triggers + removes user control.
10. **Ignoring `prefers-reduced-motion` — or nuking ALL animation under it** — both are failure modes (see §4).
11. **Stagger too slow** — >20–25ms per list item feels laggy.
12. **Springs on functional UI where restraint is needed** — cursor-following/decorative = fine; banking-app form validation = no.

## 4. Accessibility

### prefers-reduced-motion — implement correctly
- **"Reduce" means reduce, not remove.** The target is *motion* (translation, scale, parallax, spin). Fades, color changes, blur, small scale changes are safe. Replace movement keyframes with opacity/color equivalents at the same duration/easing — don't delete meaning.
- **Separate the sub-properties within one keyframe.** A keyframe like `{ transform: translateY(110%); filter: blur(12px); opacity: 0 }` mixes an unsafe part (the translate) with safe parts (blur, opacity). The reduced-motion version keeps the safe fade and drops only the movement — e.g. `transform: none` but a `blur → 0` or `opacity 0→1` still runs. Nuking the whole keyframe to `none` is the over-aggressive anti-pattern; a plain fade-in is the correct reduced-motion form of most reveals.
- Three strategies (Val Head): **Replace** (bounce → fade), **Remove** (delete motion, keep meaning), **Pause/on-demand** (autoplay → user-triggered).
- **Opt-in pattern (recommended):** wrap motion in `@media (prefers-reduced-motion: no-preference) { ... }` — unsupporting browsers default to no animation. Stronger than opt-out.
- **Anti-pattern:** `* { animation: none !important; transition: none !important; }` — too aggressive, kills essential feedback.
- **Global backstop — do it right.** A site-wide `@media (prefers-reduced-motion: reduce)` block that collapses durations (`animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; animation-iteration-count: 1 !important`) is fine **only as a backstop** paired with per-component `motion-safe:`/`no-preference` gating that does the real work. On its own it's discouraged (the 0.01ms trick can speed-run JS-driven animations and fire completion events oddly). So: gate movement per-component (primary), and let the global block catch anything third-party or forgotten (secondary) — don't rely on the global alone.
- Preserve under reduce: focus indicators, hover states (instant instead of transitioned), loading indication, essential state feedback.
- JS: `matchMedia('(prefers-reduced-motion: reduce)')` + listen for `change`. Framer Motion: `useReducedMotion()`. Gate GSAP/Lottie init.
- Motion-heavy storytelling sites: add a **visible in-page motion toggle** (persisted, defaults to OS preference) — many users don't know the OS setting exists.
- Test: Chrome DevTools → "Emulate CSS prefers-reduced-motion: reduce".

### Vestibular triggers
Up to **35% of US adults 40+** have some vestibular dysfunction. Symptoms (dizziness, nausea, migraine) can persist long after the animation ends. Three trigger factors:
1. **Relative size of movement** — full-screen wipes trigger; a small button rotation doesn't
2. **Mismatched direction/speed** — parallax ("almost universally listed as a trigger"), scroll-jacking, motion contradicting the user's scroll
3. **Perceived distance covered quickly** — big zooms (iOS 7's 3D zoom was the canonical trigger)

Trigger list: large movements, large zooms, spinning, parallax, exaggerated smooth-scroll, multi-directional motion, autoplay. Safe: color fades, opacity, blur, small scale.

### WCAG requirements
- **2.2.2 Pause Stop Hide (Level A):** auto-starting moving/blinking content lasting **>5s** alongside other content must be pausable/stoppable/hidable — unless essential.
- **2.3.3 Animation from Interactions (Level AAA):** interaction-triggered motion animation (scroll parallax, click transitions) must be disableable. Color/opacity/blur changes don't count as motion. `prefers-reduced-motion` (technique C39) satisfies this.
- **2.3.1 Flashes:** nothing flashes more than 3×/second.

## 5. Performance

### The pipeline rule
Rendering pipeline: **Style → Layout → Paint → Composite**. Cost cascades — triggering layout pays for everything after it.
- **Composite-only (cheap, GPU):** `transform`, `opacity`. Animate these whenever possible. Measured: top/left animation dropped ~50% of frames; the transform equivalent dropped ~1%.
- **Paint-triggering (moderate):** background, color, box-shadow, border-radius.
- **Layout-triggering (expensive):** width, height, top, left, margin, padding, font-size.
- CSS animations and WAAPI run on the **compositor thread** — they keep running even when the main thread is blocked (but only if they never trigger layout/paint). JS/rAF animations always run on the main thread.
- Frame budget: **16.7ms @60fps** (~10ms usable after browser overhead).

### will-change
- Last resort for existing problems, not insurance. Applying it broadly = GPU memory blowup + layer explosion.
- Pattern: add just before the change (e.g. on `mouseenter`, if change likely within ~200ms), list only the changing properties, **remove after** (`will-change: auto` on animationend).
- Side effect: creates a stacking context — can change z-ordering.

### Expensive-property workarounds
- **box-shadow:** paint the target shadow on a `::after` pseudo-element at opacity 0, animate its **opacity** — both states rasterize once, compositor cross-fades.
- **filter: blur():** pre-compute several blurred copies at increasing radii, cross-fade with opacity.
- Same crossfade trick generalizes to gradients, text-shadow, glow.

### Layout thrashing
- Reading geometry (`offsetHeight`, `getBoundingClientRect`, `scrollTop`) while layout is dirty forces synchronous layout. Read→write→read→write loop = thrash.
- Fix: **batch all reads first, then all writes.** Do writes inside `requestAnimationFrame`.
- Never drive animation with `setTimeout`/`setInterval` — not frame-synced.
- `content-visibility: auto` + `contain-intrinsic-size` skips rendering offscreen content entirely (measured ~7× rendering-time win on long pages).

## 6. When NOT to animate

- High-frequency interactions (command palette, context menu, autocomplete, repeated CRUD) — instant is correct.
- Reduced-motion users + movement/scale/parallax involved — replace with fade or nothing.
- Critical content areas (logo, headline, CTA).
- When animation would delay feedback past ~100ms or gate the next action.
- When it fails the four-purpose test.
- When 60fps can't be held on target hardware — janky animation is worse than none.
- As loading filler.

## Quick-reference values

| Parameter | Value |
|---|---|
| Feedback start after input | <100ms |
| Standard UI transition | 150–300ms |
| Hard ceiling functional UI | 400–500ms |
| Enter/exit | exit ~20–30% faster |
| List stagger | ≤20–25ms/item |
| Frame budget | 16.7ms @60fps |
| Auto-motion limit before pause control | 5s (WCAG A) |
| Flash limit | ≤3/s |
| Compositor-safe properties | transform, opacity |
| Vestibular dysfunction prevalence | up to 35% of adults 40+ |

## Sources
NN/g (animation-duration, animation-usability, animation-purpose-ux, response-times) · Emil Kowalski "Great Animations" / animations.dev · Val Head (A List Apart "Designing Safer Web Animation", Smashing reduced-motion) · web.dev (animations-overview, animations-guide, content-visibility, layout-thrashing) · MDN (prefers-reduced-motion, will-change) · WCAG 2.2.2 / 2.3.3 / 2.3.1 · Josh Comeau (prefers-reduced-motion) · Rauno Freiberg "Interaction Design" · Tobias Ahlin (box-shadow) · Material Design motion specs

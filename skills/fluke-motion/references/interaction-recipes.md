# Micro-Interaction Recipes & Loading Choreography

Reference for the fluke-motion skill. Read this when implementing or speccing common component-level interactions (buttons, toggles, toasts, tabs, accordions) or loading/progress/success states. Every recipe here already applies the fundamentals — durations in the envelope, exits faster, transform/opacity only, reduced-motion noted where it matters.

## Table of contents
1. [Buttons](#1-buttons)
2. [Like burst, checkbox, toggle](#2-like-burst-checkbox-toggle)
3. [Inputs: float label, error shake](#3-inputs-float-label-error-shake)
4. [Toasts (Sonner pattern)](#4-toasts-sonner-pattern)
5. [Dropdown, popover, tooltip](#5-dropdown-popover-tooltip)
6. [Tabs, accordion, reorder, icon swap](#6-tabs-accordion-reorder-icon-swap)
7. [Skeletons & spinners](#7-skeletons--spinners)
8. [Progress bars & counters](#8-progress-bars--counters)
9. [Staggered entrance & pull-to-refresh](#9-staggered-entrance--pull-to-refresh)
10. [Celebrations & empty states](#10-celebrations--empty-states)
11. [Defaults table](#11-defaults-table)

---

## 1. Buttons

**Press (canonical):** `scale(0.97)` on `:active`, `transition: transform 160ms ease-out`. Range 0.95–0.98. Interruptible by design (transition, not keyframes). Hover: background/border color shift 150–200ms only — reserve scale for press in dense product UI.

**Loading → success morph** (button → spinner → checkmark):
- **Lock the button width first** (measure `offsetWidth`, set inline) — content swap without locked width = layout jump.
- Three states (`idle | loading | success`) swapped via `AnimatePresence mode="wait"`, each ~150ms fade+8px y-shift. Success checkmark draws via `pathLength`/`stroke-dashoffset` (200–300ms), revert after 1.5–2s.
- Accessibility: spinner pairs with text, success announced via `aria-live="polite"`.

**Emil Kowalski's recurring rules** (apply to all recipes): under 300ms; never animate from `scale(0)` — start ≥0.9 (0.93–0.95 typical); no animation at all on very-high-frequency actions; `filter: blur(2px)` mid-transition can mask crossfade imperfections.

## 2. Like burst, checkbox, toggle

**Heart/like burst (Twitter pattern):** heart scales 1 → 0 → 1.2-1.4 → 1 with back-out easing `cubic-bezier(.17,.89,.32,1.49)` (~400–800ms); particles fire radially (7 groups at ~51.4° intervals) with staggered opacity; ring expands + hollows (border-width → 0). Production alternative: sprite sheet + `steps(28)` over ~0.8s. **Optimistic update: fill the heart instantly on tap**, confirm in background.

**Checkbox checkmark draw:** `stroke-dasharray` = path length (or `pathLength="1"` attribute), animate `stroke-dashoffset` → 0 on `:checked`. Framer Motion: `animate={{ pathLength: checked ? 1 : 0 }}` 200–300ms. Box fill/border crossfade runs parallel at 150–200ms.

**Toggle:** Material spec = **100ms total** (thumb slide + track color together). iOS-feel spring: `stiffness: 700, damping: 30` (the widely-copied config); iOS pattern also elongates the thumb ~20–30% while pressed, anchored to the active side.

## 3. Inputs: float label, error shake

**Floating label:** label absolute-positioned, `transition: all 0.15–0.2s ease`; on `:focus-within` or `:not(:placeholder-shown)`: move to top border, shrink 16→12px, accent color. Pure CSS.

**Error shake — the concrete values:**
```css
@keyframes shake {
  0%,100% { transform: translateX(0); }
  15% { transform: translateX(-6px); } 30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); } 60% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
}
.input--error { animation: shake 450ms ease-in-out; }
```
- **Decaying amplitude** (−10→8→−6→4→−3px…) reads physical; constant amplitude reads robotic. 3–5 direction changes, 400–500ms total (the famous 820ms CSS-Tricks version is too long by modern judgment).
- Pair with border→red (~150ms) + error text fade-in. **Must** wrap in `@media (prefers-reduced-motion: no-preference)` — shake is a classic vestibular trigger; fallback = color change only.

## 4. Toasts (Sonner pattern)

From Emil Kowalski's definitive writeup:
- **Transitions, not keyframes** — interruptible/retargetable; keyframes make rapidly-added toasts jump.
- **Enter:** mount at `translateY(100%)`, flip `data-mounted` after first render → transitions to 0. 400ms. Percentages (not px) so any-height toasts move exactly their own height.
- **Stacking:** behind-toast = `translateY(-14px · index) scale(1 − 0.05 · index)`, via CSS custom properties. All stacked toasts adopt the front toast's height.
- **Swipe dismiss:** distance threshold OR `velocity > 0.11` (`|swipeAmount| / timeTaken`) — momentum wins even on short swipes. Wrong-direction drags get friction, not a hard block.
- **Auto-dismiss 4s**, timer paused on hover and while tab hidden. Exit faster than enter (~200–300ms), then remaining toasts re-stack.

## 5. Dropdown, popover, tooltip

**The recipe:** `opacity 0→1` + `scale 0.95→1` (never from 0), 150–200ms ease-out in, 100–150ms ease-in out. **Transform-origin from the trigger** — Radix exposes it: `transform-origin: var(--radix-popover-content-transform-origin)` (accounts for side/align/collision flips).

**Radix mechanics:** style via `[data-state="open"]`/`[data-state="closed"]`; exit animations require CSS **animations** (Radix suspends unmount for animations, not transitions); JS libraries need `forceMount` + `AnimatePresence`.

**Tooltip delay choreography:** first tooltip 300–700ms open delay; once one is open, **siblings in the group show instantly with zero animation** (Radix `delayDuration` + `skipDelayDuration`). Tooltip transition itself ~125ms.

## 6. Tabs, accordion, reorder, icon swap

**Tab underline:** `<motion.div layoutId="active-tab" />` rendered only in the active tab — FLIP handles the slide automatically. Spring `bounce: 0.2, duration: 0.6` or 200–300ms ease-out. Content: crossfade with complementary easings (exit ease-in ~100-150ms, enter ease-out ~150-200ms) — or no content animation at all; tab switching is high-frequency.

**Accordion (`height: auto` problem)** — solutions in order of practicality:
1. Radix: keyframe to `var(--radix-accordion-content-height)`, 200–300ms ease-out.
2. **Grid trick** (no-JS, all browsers): `grid-template-rows: 0fr → 1fr` transition; inner element `overflow: hidden; min-height: 0`; padding goes on the inner element.
3. `interpolate-size: allow-keywords` — native `height: 0 → auto`; Chrome/Edge only (129+), ships as progressive enhancement. `@starting-style` + `transition-behavior: allow-discrete` ARE cross-engine in 2026 for display:none entry/exit.
4. JS `scrollHeight` measure (the classic).
Note: height animation triggers layout per frame — fine for small accordions, avoid on big surfaces.

**Drag-to-reorder:** `whileDrag={{ scale: 1.03, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}`; Framer Motion `Reorder.Group/Item` FLIPs siblings automatically; drop settles with a spring (visible overshoot reads physical).

**Copy/icon swap:** icon ⇄ checkmark via `AnimatePresence mode="popLayout"`, each icon `scale 0→1` spring or 150ms; **revert after 2s** (de facto standard). Announce "Copied" via `aria-live`.

## 7. Skeletons & spinners

**Shimmer:**
```css
.skeleton {
  background: linear-gradient(100deg, #eceff1 25%, #f6f7f8 50%, #eceff1 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}
@keyframes shimmer { 0% { background-position-x: 200%; } 100% { background-position-x: 0%; } }
```
Sweep left→right (reading direction). **Sync siblings** — `background-attachment: fixed` or one container overlay; unsynced shimmer on sibling cards looks broken.

**When which (NN/g research):** <1s → nothing. ~2–10s → skeleton (full region, known layout) or spinner (single small module). >10s → progress bar. Frame-only skeletons (no content placeholders) read as failure. If LCP is <~800ms, skip the skeleton — the swap is noise.

**Skeleton→content:** crossfade 150–300ms, zero layout jump (skeleton matches final dimensions — this is also the CLS guard). Last text line ~60–80% width.

**Anti-flash spinner choreography:** don't render the spinner until **~300–500ms** has elapsed; once shown, keep **min ~200–500ms** even if the request finishes (the `spin-delay` pattern). Below ~200ms wait, a spinner does harm.

**Optimistic UI:** update instantly, request in background, roll back with a toast on failure. For high-frequency, rarely-failing, reversible actions only — never payments/destructive ops. React 19: `useOptimistic`.

## 8. Progress bars & counters

**Determinate bars:** perceived speed research (Harrison, CMU) — progress that **accelerates toward the end** feels faster; users tolerate early stalls, hate stalls near 100%. Never let the bar freeze near the end. Implement via `transform: scaleX()` (`transform-origin: left`), transition each update ~200–400ms ease-out.

**Trickle pattern (NProgress):** start → small random increments asymptotically approaching but never reaching 100%; only `.done()` completes (fill ~200ms, hold ~150ms, fade ~300ms).

**Upload:** real percent from `upload.onprogress`; at 100% with server work remaining, switch label to "Processing…" — beats a bar stuck at 99%.

**Number counters:** duration **1–2s**, ease-out (slows into the final value for legibility), trigger via IntersectionObserver once. Digit-roll: NumberFlow library (`tabular-nums`, respects reduced-motion). Pure CSS: `@property --num` + `counter-reset` transition (integers only, Baseline).

## 9. Staggered entrance & pull-to-refresh

**Stagger after load:** 30–100ms per item (50ms = snappy dashboards), each item fade + `translateY(8–16px)` 200–400ms ease-out. **Cap the total** — stagger only the first ~6–10 visible items; 30 items × 100ms = 3s of blocked content. CSS: `animation-delay: calc(var(--i) * 60ms)` + `animation-fill-mode: backwards`.

**Pull-to-refresh state machine:** (1) pull — indicator emerges with ~0.5× finger resistance, arc/rotation maps to pull progress; (2) threshold (~60–80px) — 100% opacity + brief scale pulse = "release to refresh"; (3) release past threshold — indicator detaches, becomes indeterminate spinner; (4) done — spinner shrinks/fades ~200ms, content settles ease-out. Web: `overscroll-behavior-y: contain` to suppress native PTR.

## 10. Celebrations & empty states

**The two-factor test: importance × rarity.** Celebrate rare + meaningful (first ship, streak milestone, onboarding done); never routine actions — by the third viewing it's noise. Duolingo evidence: bespoke animations for milestones only (day 7/30/100), plain tick otherwise; the milestone animation alone moved day-7 retention +1.7%. **Scarcity keeps celebration load-bearing.**

- canvas-confetti: `confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })`; ≤100 particles for 60fps; set `disableForReducedMotion: true`.
- Stripe-style success: circle scales in (~300ms) → check draws via dashoffset (~300–500ms, slight delay).
- Rules: ≤2–3s self-dismissing, first-time-only flags, never block the next action.

**Empty states:** gentle fade + 8–16px rise, 300–400ms ease-out; illustration first, text/CTA staggered 50–100ms behind. Optional ambient float (±4–6px over 3–6s) — subtle enough that users notice the state, not the motion. **Gate behind resolved data** — never flash "no items" before the fetch settles.

## 11. Defaults table

| Interaction | Duration | Values |
|---|---|---|
| Button press | 150–160ms | ease-out, scale 0.97 |
| Toggle/checkbox | ~100ms | Material spec |
| Checkmark draw | 200–300ms | dashoffset→0 |
| Error shake | 400–500ms | ±4–10px decaying, 3–5 oscillations |
| Dropdown in / out | 150–200ms / 100–150ms | scale from 0.95, Radix origin var |
| Tooltip | ~125ms; delay 300–700ms, 0ms within group | |
| Toast enter / exit | 400ms / 200–300ms | translateY(100%); stack −14px & ×0.95/index; velocity >0.11 dismisses; 4s auto-hide |
| Tab underline | 200–300ms or spring | layoutId FLIP |
| Accordion | 200–300ms | grid 0fr→1fr or Radix var |
| Shimmer | 1–2s loop | linear |
| Spinner | show after 300–500ms, min display 200–500ms | |
| Count-up | 1–2s | ease-out |
| Stagger | 30–100ms/item, total <~600ms | items 200–400ms ease-out |
| Heart burst | 0.8–1s | back-out pop |
| Confetti | ≤2–3s, ≤100 particles | milestones only |

## Sources
Emil Kowalski (building-a-toast-component, 7-practical-animation-tips, great-animations, Sonner) · Radix UI animation guides · Josh Comeau (interpolate-size, Boop) · CSS-Tricks (Twitter heart, shake, grid auto-height, number counters, stagger) · NN/g (skeleton screens, animation duration, skeleton-vs-spinner) · Chris Harrison progress-bar research (CMU) · NProgress · spin-delay · NumberFlow · canvas-confetti · Duolingo streak design blog · Motion docs (Reorder, AnimatePresence, layout) · Material switch spec · manu.ninja pull-to-refresh

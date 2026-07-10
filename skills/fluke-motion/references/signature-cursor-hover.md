# Signature Cursor & Hover Effects — Award-Site Pointer Techniques

Reference for the fluke-motion skill. Read this for custom cursors, trails, magnetic/sticky pointers, spotlight reveals, image trails, and craft-level hover states. Basic magnetic buttons and WebGL hover distortion live in advanced-techniques.md / creative-effects.md — this file is the full pointer vocabulary above them.

## Foundations (apply to everything below)

**The universal lerp loop** — nearly every cursor effect is this one pattern:
```js
const pos = { x: 0, y: 0 }, target = { x: 0, y: 0 };
window.addEventListener('pointermove', e => { target.x = e.clientX; target.y = e.clientY; });
(function raf() {
  pos.x += (target.x - pos.x) * 0.12;   // lerp factor = "weight"
  pos.y += (target.y - pos.y) * 0.12;
  el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
  requestAnimationFrame(raf);
})();
```
GSAP shortcut: `gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" })`. React: `useMotionValue` + `useSpring`.

**Universal gating — non-negotiable:**
```css
@media (any-hover: hover) and (pointer: fine) { /* cursor effects */ }
@media (prefers-reduced-motion: reduce) { .cursor { display: none; } }
```

**Universal pitfalls:** `cursor: none` hides the pointer for users who enlarged it via OS accessibility — consider keeping native cursor and making the custom element an *accent*; follower element MUST have `pointer-events: none` + `aria-hidden`; follower always lags one frame behind the hardware cursor — lean into the lag (obvious follower) rather than pretending it's the cursor; every hover affordance needs a `:focus-visible` equivalent; one shared rAF + pointermove for the whole page (darkroom's Tempus pattern).

## Table of contents
1. [Dot + trailing ring](#1-dot--trailing-ring)
2. [Cursor trails](#2-cursor-trails)
3. [Blend-mode invert cursor](#3-blend-mode-invert-cursor)
4. [Sticky/morphing cursor](#4-stickymorphing-cursor)
5. [Contextual label cursor](#5-contextual-label-cursor)
6. [Spotlight/flashlight reveal](#6-spotlightflashlight-reveal)
7. [Gooey/elastic cursor](#7-gooeyelastic-cursor)
8. [Media follows cursor](#8-media-follows-cursor)
9. [Repel/attract fields & proximity](#9-repelattract-fields--proximity)
10. [Image trail](#10-image-trail)
11. [Portfolio list reveal](#11-portfolio-list-reveal)
12. [Directional-aware hover](#12-directional-aware-hover)
13. [Text link hovers](#13-text-link-hovers)
14. [Spotlight card grid](#14-spotlight-card-grid)
15. [Shared highlight, dock magnify, tilt+glare](#15-grid-feel-patterns)

---

## 1. Dot + trailing ring

**What:** native cursor replaced by a dot glued to the pointer + larger ring lagging behind. The default vocabulary of awwwards portfolios. **Why:** the trailing ring visualizes velocity — fast moves stretch the pair apart, rest snaps together = continuous kinetic feedback. Portfolio/agency sites only; not utility apps where precision matters.

**Stack:** vanilla lerp · GSAP quickTo · Framer Motion useSpring · drop-in: Cuberto mouse-follower (states, text/image/video modes, velocity skew), Blobity (canvas blob; GPLv3/commercial dual license — check).

**The entire effect = two lerp factors on one target:** dot ≈ 0.35–1.0, ring ≈ 0.08–0.15. Scale ring + fade dot on hover of interactives (delegate via `closest('a,button,[data-cursor]')`).

**Pitfalls:** `cursor: none` silently reverts inside iframes/inputs; fade the follower on `document` mouseleave or it freezes mid-viewport; initialize hidden (else it sits at 0,0 until first move).

## 2. Cursor trails

**What:** ribbon/particles/smoke streaming behind the pointer. **Why:** rewards *motion* rather than targets — ideal where there's little to click (splash, 404, coming-soon); increases dwell/exploration.

**Three tiers:** (1) DOM: spawn+fade divs — pool and reuse nodes, ≤30 concurrent; (2) 2D canvas polyline: array of N points, each chases its predecessor `points[i] += (points[i-1] - points[i]) * 0.35`, stroke with decreasing width; (3) WebGL: OGL `Polyline` with spring-simulated points (Codrops), or OGL **Flowmap** — cursor velocity written into a decaying ping-pong texture that any shader samples for displacement (the basis of many "liquid reveal" effects).

**Pitfalls:** handle devicePixelRatio on canvas; render flowmap FBOs at half resolution; gate on `pointerType === 'mouse'` (touch fires pointermove during scroll); decorative only — never encode information in a trail.

## 3. Blend-mode invert cursor

**What:** solid white circle that inverts every pixel beneath (`mix-blend-mode: difference`) — white text turns black through it, images go negative. Editorial/high-fashion staple. **Why:** solves cursor-visibility-over-any-background for free, and creates drama over large type. Monochrome designs only — on colorful sites the inversion looks accidental.

```css
.cursor { position: fixed; width: 40px; height: 40px; border-radius: 50%;
  background: #fff; pointer-events: none; mix-blend-mode: difference; z-index: 9999; }
```

**The classic bug:** blend mode works against the *stacking context* — any ancestor with `transform`, `opacity<1`, `filter`, or `will-change` creates a new context and the effect silently dies. Body needs an explicit background color. Design the palette with inversion in mind (pure blue inverts murky).

## 4. Sticky/morphing cursor

**What:** the cursor element is *captured* by a target — snaps to its center, morphs to its shape (pill outline), drifts only ~15% with the real pointer while stuck, elastically snaps free on exit. **Why:** communicates "target acquired" — enlarges perceived hit area (Fitts's law comfort) + a tactile snap moment. Primary nav/CTAs only; everything sticky = pointer feels hijacked.

**Mechanism:** on enter, tween follower to target rect center, morph size (`scaleX/scaleY` on a base square, NOT width/height — reflow), reduce follow influence: `pos = targetCenter + (pointer − targetCenter) × 0.15`; exit with `elastic.out(1, 0.3)`. Cache rects on enter, invalidate on scroll/resize. Reference: Olivier Larose sticky-cursor tutorial (Framer Motion), Cuberto `data-cursor-stick`.

## 5. Contextual label cursor ("View" / "Drag" / "Play")

**What:** cursor swells into a labeled disc over specific zones. **Why: this one is FUNCTIONAL, not decorative** — an affordance layer for undiscoverable interactions (draggable carousels are invisible without it). The strongest candidate to keep even in restrained designs.

**Mechanism:** data-attribute driven — `data-cursor-text="Drag"`, delegated `mouseover` reads it, tweens scale 12px→~80px. Osmo's dynamic cursor pen is the canonical open pattern; Cuberto has `.setText()/.setImg()/.setVideo()`; Motion.dev ships a React `Cursor` component.

**Pitfalls:** the label is invisible to AT — duplicate as `aria-label` + visible on focus; flip near viewport edges; `overwrite: true` on rapid target changes; touch users need a visible hint instead.

## 6. Spotlight/flashlight reveal

**What:** page dark; a circle of light around the pointer reveals content. **Why:** content is *earned* by moving — curiosity engine for single-message heroes, mystery intros. **Never for content users must read** (body copy, nav).

```css
.overlay { position: fixed; inset: 0; pointer-events: none;
  background: radial-gradient(circle 180px at var(--x) var(--y),
              transparent 0%, rgba(0,0,0,.95) 220px); }
```
JS just sets `--x/--y` on pointermove. Variants: `mask-image` on the content layer (when the hidden layer has images), `clip-path: circle()` for a hard beam, dual-text-layer for spotlight text.

**Pitfalls:** keyboard users can't move the light — bind it to `:focus-visible` positions as fallback, or reveal-all after N seconds; essential content (nav, CTA) stays outside the darkness; scope the custom properties, don't repaint the root.

## 7. Gooey/elastic cursor

**What:** viscous blob that stretches along its motion vector, wobbles on stop, merges liquidly with trail droplets (metaball). **Why:** maximum personality — playful brands only; one per site.

**Mechanism A — SVG goo filter** (blur + alpha-contrast matrix `18 -7` snapping soft overlap into a crisp merged silhouette — full recipe in creative-effects.md §4) applied to a container of the blob + trailing droplets with staggered lerp factors — they merge/split as they chase. **Mechanism B — velocity stretch:** `rotation = atan2(vy, vx)`, `scaleX = 1 + k|v|`, `scaleY = 1 − k|v|·0.5`.

**Pitfalls:** SVG filters are CPU-rasterized — small container, static filter values, ≤6 animated primitives; Safari janks on `filter: url()` over animated content; velocity math must be dt-scaled (frame-rate independent).

## 8. Media follows cursor

**What:** hovering a text link summons a thumbnail (image/muted video) that floats near the pointer with lag and velocity-based swing. **Why:** keeps a design typographic/minimal while staying visual — image exists on demand. The lag+swing is what reads expensive; an instantly-teleporting image reads broken.

**Mechanism:** one fixed container, swap `src` on link enter (PRELOAD ALL — late first image is the most common flaw), fade/scale in, lerp-follow, `rotation = clamp(vx * 0.15, -15, 15)`. Codrops "Menu Image Animation on Hover" is the canonical build; Cuberto `.setImg()` is one call.

**Pitfalls:** `translate3d` never top/left; video: `muted playsinline preload="metadata"`; `aria-hidden` + `pointer-events: none`; clamp to viewport on edge rows; touch gets static thumbnails.

## 9. Repel/attract fields & proximity

**What:** a field of elements (dots, letters, tiles) flees from or is pulled toward the pointer within a radius, springing home after. Proximity variant: elements react *before* hover — nav brightens on approach, letters ramp font-weight by distance. **Why:** anticipation is the highest-craft signal — the page seems sentient. Also practical progressive disclosure (controls fade in as the hand approaches).

**One primitive, many outputs:**
```js
const t = Math.max(0, 1 - dist / RADIUS);   // linear falloff (or Gaussian exp(-d²/2σ²))
const eased = t * t;
// map eased → opacity, scale, font-variation 'wght', glow, or position offset
```
**Pitfalls:** precompute home positions once (+ resize), pure math per frame — never per-frame `getBoundingClientRect`; compare squared distances (skip sqrt); never repel actual controls (users chase runaway buttons); proximity is mouse-only by definition — same controls must appear on `focus-within` and always-on for touch; ≥200 elements → canvas/WebGL.

## 10. Image trail

**What:** moving the mouse spawns a trail of photographs along the path — each pops in, lingers, exits (fade/scale/gravity-fall). The archetypal fashion/photo-studio hero. **Why:** shows a whole portfolio's texture in seconds — the user *paints* with your imagery.

**Mechanism (Codrops ImageTrailEffects):** accumulate pointer distance `distance += |Δx| + |Δy|`; when past threshold (`innerWidth / 8`), position the next image from a **fixed pool of ~10** at the cursor, play in→hold→out timeline, cycle the pool (never create nodes at runtime).

**Pitfalls:** preload + `img.decode()` everything, ≤400px sources (this effect trivially ships 10MB); threshold too low = strobing image storm (photosensitivity risk); `alt=""` + `aria-hidden`; contain in `overflow: hidden`.

## 11. Portfolio list reveal

**What:** page is just a list of project names; hover reveals the project image — fixed slot, cursor-following (#8), or full-viewport background crossfade. The dominant awwwards portfolio layout of the last five years. **Why:** typography-first = fast paint; image-on-demand = high drama. Fixed slot when aspects vary wildly; cursor-follow for kinetic feel; background-crossfade for immersion.

**Pitfalls:** debounce rapid list-scrubbing (10 rows in 300ms ≠ 10 full timelines — kill/overwrite); preload on idle, not hover; dimmed siblings must hold WCAG contrast; `focusin` triggers the same reveal for keyboard.

## 12. Directional-aware hover

**What:** fill/overlay enters from the edge the cursor came from, exits toward the leave edge. **Why:** sub-perceptual craft — users never consciously notice, but it always "feels right" because it agrees with hand motion.

```js
function direction(e, el) {
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left - r.width / 2) * (r.width > r.height ? r.height / r.width : 1);
  const y = (e.clientY - r.top - r.height / 2) * (r.height > r.width ? r.width / r.height : 1);
  return Math.round((Math.atan2(y, x) / 1.5707963 + 5) % 4); // 0 top, 1 right, 2 bottom, 3 left
}
```
Compute on enter AND leave, set class (`in-top`, `out-left`…), CSS transitions do the slide. 1D cousin for underlines: `transform-origin` left/right swap — grows from left on enter, shrinks to right on leave, zero JS.

**Pitfall:** keyboard focus has no direction — pick a default for `:focus-visible`.

## 13. Text link hovers

The highest-frequency craft surface (nav links hovered hundreds of times/session), near-zero cost:
- **Dual-text slide-up** (elegant/editorial): text slides up out of an `overflow: hidden` clip, duplicate slides in from below — pure CSS with `::after { content: attr(data-text); top: 100% }` + `translateY(-100%)` on hover, `cubic-bezier(.76,0,.24,1)`.
- **Character stagger** (playful): GSAP SplitText `mask: 'chars'` (purpose-built — auto overflow-clip per char) + `stagger: 0.02`.
- **Clip-path wipe** (bold): colored copy wipes across via `clip-path: inset()`.
- **Underline crafts:** gradient `background-size` grow, squiggly SVG, thickness morph.
- **Variable-font weight ramp:** `font-variation-settings 'wght'` on hover, or per-letter by proximity (#9).

**Pitfalls:** SplitText handles aria automatically; manual splitters must add `aria-label` + `aria-hidden` spans; `data-text` duplicates stay in sync; splits kill kerning across boundaries — test with production font; hover = `:focus-visible`, always.

## 14. Spotlight card grid

**What:** dark bento/card grid; radial glow inside each card tracks the pointer, border lights up around it — bleeding across adjacent cards so the grid feels like one lit surface (Linear/Cursor.com/Evervault look). **Why:** the current SaaS/devtool aesthetic — premium responsiveness with zero layout motion. Fails when the glow is too bright — sheen, not flashlight.

```js
grid.addEventListener('pointermove', e => {
  for (const card of cards) {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', e.clientX - r.left + 'px');
    card.style.setProperty('--my', e.clientY - r.top + 'px');
  }
});
```
```css
.card::before { /* border glow: pseudo behind content, only the rim shows */
  background: radial-gradient(400px circle at var(--mx) var(--my), rgba(120,180,255,.4), transparent 40%); }
.card::after  { /* interior sheen, subtler, fades in on hover */
  background: radial-gradient(600px circle at var(--mx) var(--my), rgba(255,255,255,.06), transparent 40%);
  opacity: 0; transition: opacity .4s; }
```
**Updating every card from one grid listener is what makes the glow travel across boundaries.** Prebuilt: Aceternity Card Spotlight / Evervault Card / Glowing Effect.

**Pitfalls:** rects fine ≤~20 cards, beyond that cache; transition only opacity (never the custom properties); glow must never be the only hover indicator — pair with border-color on `:focus-within`.

## 15. Grid-feel patterns

**a) Shared sliding highlight** (iPad-cursor nav): ONE pill/underline element that slides between items instead of appearing per-item. Framer Motion `layoutId` renders it inside whichever item is hovered — FLIP does the rest. **Why:** continuity — the highlight behaves like a physical object. Pitfalls: clear on nav-level mouseleave; sync with the active-route indicator so two pills don't fight.

**b) Dock magnification** (macOS): hovered item grows, neighbors grow partially by distance. `useTransform(distance, [-150, 0, 150], [44, 80, 44])` wrapped in `useSpring({ mass: 0.1, stiffness: 200, damping: 15 })`; Gaussian falloff `scale = (mag−1)·exp(−d²/2σ²)+1`. Pitfalls: keep ≤1.5× (moving targets hurt motor-impaired users); disable on touch.

**c) Tilt + glare:** covered in creative-effects.md §7 — pointer → `rotateX/rotateY` ±10°, glare gradient moves opposite. Most motion-sickness-prone pattern here — hard-disable under reduced-motion.

## Distilled rules

One shared rAF/pointermove for the page · transforms only · pool DOM nodes · cache rects · `pointer-events: none` + `aria-hidden` on all followers · gate behind `(any-hover: hover) and (pointer: fine)` · kill under reduced-motion · **one hero effect per page — juries reward restraint plus one signature move, not stacked gimmicks.**

## Sources
Codrops (custom cursor effects, image trail, OGL mouse trails/flowmap, gooey cursor, menu image animation, direction-aware hover, Three.js repulsion) · Cuberto mouse-follower · Blobity · Motion.dev Cursor docs · Olivier Larose (sticky cursor) · Osmo (dynamic cursor, masked text reveal) · Aceternity UI (card spotlight, evervault, glowing) · Build UI (magnified dock) · vanilla-tilt/Atropos · darkroom.engineering (Tempus/Lenis) · dbushell (cursor a11y) · CSS-Tricks (direction-aware, gooey, cursor styling) · GSAP forums (sticky/magnetic threads) · Awwwards collections (hovers/cursors)

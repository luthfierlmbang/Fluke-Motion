# Advanced Motion Techniques — Parallax, Scroll-Driven, Springs, Orchestration, Showpieces

Reference for the fluke-motion skill. Read this when the request involves parallax, scroll effects, spring physics, layout/shared-element transitions, gesture-driven motion, or top-tier showpiece animation (WebGL heroes, image-sequence scrub, text reveals, Lottie/Rive).

## Table of contents
1. [Parallax](#1-parallax)
2. [Scroll-driven animations](#2-scroll-driven-animations)
3. [Spring physics](#3-spring-physics)
4. [FLIP & View Transitions](#4-flip--view-transitions)
5. [Orchestration & choreography](#5-orchestration--choreography)
6. [Showpieces](#6-showpieces)
7. [Gesture-driven animation](#7-gesture-driven-animation)
8. [Browser support & library landscape (2026)](#8-browser-support--library-landscape-2026)

---

## 1. Parallax

**Modern default (2026): CSS scroll-driven** — compositor-thread, zero JS:
```css
.parallax-bg {
  animation: parallax linear;
  animation-timeline: scroll(root);
}
@keyframes parallax { to { transform: translateY(-20%); } }
```
React: Motion's `useScroll` + `useTransform`:
```jsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
```

**JS fallback rules** (Chrome "Performant Parallaxing"):
- Only `translate3d`/`scale`/`rotate`/`opacity`. Never `background-position` (repaint/frame) or `top/left` (layout).
- Passive scroll listener stores `scrollY`; apply transforms in `requestAnimationFrame`. Cull offscreen layers.
- Avoid `background-attachment: fixed` — forces repaints, iOS Safari silently ignores it. Cap ~3 layers on mobile.

**CSS-only perspective trick** (Keith Clark): container gets `perspective: 1px; overflow-y: auto`, layers get `translateZ(-1px) scale(2)`. Scale correction: `scale = (perspective − translateZ) / perspective`. Fully compositor-handled, but: intermediate elements flatten 3D context, inner-container scrolling breaks `position: sticky` and mobile URL-bar behavior. Largely superseded by `animation-timeline`.

**When parallax hurts:**
- **#1 vestibular trigger** ("almost universally listed"). Always gate behind `prefers-reduced-motion` — swap to opacity fade.
- LCP: keep the hero image statically rendered; apply parallax as enhancement after load.
- Layer count = GPU memory pressure on mobile.

## 2. Scroll-driven animations

### Native CSS (preferred where support allows)
Two timeline types:
- **`scroll()`** — maps container scroll range to animation progress. `animation-timeline: scroll(root block)` → reading-progress bar.
- **`view()`** — tracks subject's journey through the scrollport (reveal-on-scroll without JS). `animation-timeline: view()`.

Key mechanics:
- `animation-range: entry 0% entry 100%` segments the view timeline (keywords: `entry`, `exit`, `cover`, `contain`). Range selectors can be embedded directly in keyframes.
- Named timelines: `scroll-timeline: --tl` on the scroller, `animation-timeline: --tl` on the subject. Only resolves on ancestors — hoist with `timeline-scope` for siblings.
- Gotcha: `animation` shorthand resets timeline — declare `animation-timeline` AFTER the shorthand, and set `animation-duration: auto`.
- Use `linear` easing for scrubbed animations (progress-mapped).
- Runs on the compositor when animating transform/opacity — immune to main-thread jank.
- Progressive-enhance: `@supports (animation-timeline: view())`.
- **`animation-trigger`** (Chrome 145+, Chrome-only): declarative scroll-*triggered* (fire-once) animation — IntersectionObserver replacement.

### GSAP ScrollTrigger (complex choreography, wide support)
```js
gsap.to(".el", { x: 400, scrollTrigger: {
  trigger: ".el", start: "top bottom", end: "bottom top",
  scrub: 1,            // true = locked to scroll; number = catch-up seconds
  pin: true,           // pin-spacer wrapper, position:fixed
  snap: { snapTo: "labels", duration: {min:.2, max:3} },
  toggleActions: "play pause resume reset",  // onEnter onLeave onEnterBack onLeaveBack
  invalidateOnRefresh: true, markers: true /* dev */
}});
```
- Horizontal-scroll section: pin container + scrub + tween `xPercent` on inner track; nested triggers need `containerAnimation` + `ease: "none"` on the container tween.
- Reveal-many: `ScrollTrigger.batch(".cards", { onEnter: els => gsap.from(els, {opacity:0, y:40, stagger:0.1}) })`.
- Responsive: `gsap.matchMedia()`; call `ScrollTrigger.refresh()` after layout changes; React: `useGSAP` for auto-cleanup.
- Mobile: `ScrollTrigger.normalizeScroll(true)` fights iOS URL-bar jitter. `content-visibility: auto` on trigger elements breaks position calc.

### Intersection Observer (baseline for one-shot reveals + JS side effects)
```js
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) {
    e.target.classList.add('in-view');
    io.unobserve(e.target);   // one-shot
  }
}, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
```
JS detects, CSS animates. Being displaced by `view()` for pure visual reveals; still needed for side effects.

## 3. Spring physics

**Why springs beat duration+bezier:**
1. **Velocity continuity** — springs integrate from current position+velocity, so mid-flight retargeting is seamless. CSS transitions restart toward the new target at zero velocity (visible hitch).
2. **Gesture handoff** — drag-release velocity feeds in as spring initial velocity; the element "keeps moving" naturally.
3. **Distance-proportional timing** — one config works for 10px and 1000px.

Rule: **springs for interactive/gesture-driven/interruptible motion; tweens for choreographed fire-and-forget sequences; linear for light (opacity/color).**

**Framer Motion / Motion config:**
```jsx
transition={{ type: "spring", stiffness: 400, damping: 30, mass: 1 }}
// or perceptual (easier to reason about):
transition={{ type: "spring", visualDuration: 0.4, bounce: 0.25 }}
```
stiffness = pull strength (higher = snappier) · damping = opposing force (0 = oscillates forever) · mass = inertia. `visualDuration` = time to *appear* settled — easier to coordinate with tweens. Springs auto-inherit gesture velocity.

**react-spring:** `config: { mass: 1, tension: 170, friction: 26 }` (defaults); presets `gentle/wobbly/stiff/slow`. Imperative `api.start()` updates without React re-render — key for 60fps gesture loops with `@use-gesture`.

**Apple guidance (WWDC23):** pick perceptual duration first, then tune bounce. Bounce 0 = smooth, 0.15 = brisk tail, 0.3 = noticeably bouncy, **>0.4 = avoid for UI**.

**CSS-only springs — `linear()` easing:** piecewise-linear approximation of any curve including overshoot. Generate via Jake Archibald's linear-easing-generator or kvin.me/css-springs. Baseline support (Chrome 113+, FF 112+, Safari 17.2+). Limitation: predetermined curve + baked duration — fine for hovers/one-shot bounces, not gestures.

## 4. FLIP & View Transitions

### FLIP (First, Last, Invert, Play)
Animate layout changes (reorder, insert, resize) using only transform:
1. Measure `getBoundingClientRect()` (First) → 2. apply the layout change → 3. measure again (Last) → 4. transform the element back to its old position (Invert) → 5. animate transform to `none` (Play).

Libraries do per-frame scale correction so children/border-radius don't distort: **Framer Motion `layout` prop** (+ `layout` on children corrects distortion), **GSAP Flip plugin** (`Flip.getState(targets)` → mutate DOM → `Flip.from(state, {...})`).

### View Transitions API
```js
document.startViewTransition(() => updateDOM());
```
Browser snapshots old/new state and animates between them via `::view-transition-*` pseudo-elements. Tag elements with `view-transition-name: hero-img` → element morphs position/size = **native shared-element transitions**.
- Cross-document (MPA): `@view-transition { navigation: auto; }` on both pages — zero JS.
- Customize per-group: `::view-transition-group(*) { animation-duration: .35s; }`.
- Pitfalls: duplicate `view-transition-name` silently skips the transition; page is frozen/non-interactive during transition (keep short); name fixed headers so they don't ride the root crossfade; React needs `flushSync` in the callback; always disable under reduced-motion.

**Decision rule:** View Transitions for route-level transitions and shared-element morphs (snapshot-based, not interruptible). FLIP libraries (Motion `layout`, GSAP Flip) for continuous, interruptible, gesture-linked layout animation.

## 5. Orchestration & choreography

**GSAP timeline:**
```js
const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
tl.from(".hero-title", { yPercent: 100 })
  .from(".hero-sub", { opacity: 0, y: 20 }, "-=0.4")   // overlap
  .from(".cta", { scale: 0.9, opacity: 0 }, "<")        // "<" = with previous
  .from(".card", { y: 40, opacity: 0,
      stagger: { each: 0.08, from: "center", grid: [3,4] } });
```
Position grammar: `"+=0.5"` / `"-=0.5"` relative, `"<"`/`">"` prev-start/prev-end, labels. Stagger: `each` (per-item) vs `amount` (total spread), `from: "center"/"edges"/index`, `grid` for 2D distance-based staggers. Timelines nest → modular scenes; pair with ScrollTrigger `scrub` + `snap: "labels"`.

**Framer Motion variants** — parents orchestrate, children own their motion:
```jsx
const parent = { hidden: { opacity: 0 }, show: { opacity: 1,
  transition: { when: "beforeChildren", delayChildren: 0.2, staggerChildren: 0.08 } } };
const child = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
```
Variant labels propagate down the tree. `whileInView={{...}} viewport={{ once: true, amount: 0.3 }}` for scroll reveals. `layoutId` on two different components = FLIP morph between them (tab underline, card→modal) — wrap in `AnimatePresence`.

**Choreography guidance:** stagger 30–120ms per item for hero sequences (20–25ms for plain lists), cap total UI sequence <~700ms (marketing can go longer); stagger entrances, exits simultaneous/faster.

## 6. Showpieces

### Lottie / dotLottie
After Effects → Bodymovin → JSON → `lottie-web` (SVG/canvas renderer). dotLottie (.lottie) = zipped container, 40–70% smaller, worker-thread rendering via `DotLottieWorker`, now supports state machines. Scroll-scrub: map progress to `goToAndStop(progress * totalFrames, true)`.
**When:** decorative/brand micro-animations, empty states, animated icons — designer lives in AE. **Not** for deep interactivity or huge scenes. Pitfalls: embedded raster images balloon JSON; pause offscreen; lazy-load below-fold; respect reduced-motion.

### Rive
Purpose-built interactive vector runtime; `.riv` ~10–15× smaller than equivalent Lottie. **State machines authored into the file** (boolean/number/trigger inputs, pointer listeners wired in-editor), data binding to live app data. `@rive-app/webgl2` for full features.
**When:** product-critical interactive graphics — mascots reacting to cursor, interactive onboarding, game-like heroes. Rive's framing: "if animation is something you add → Lottie; if your product relies on it → Rive." Pitfall: WASM payload (~hundreds of KB) — lazy-load; call `.cleanup()`.

### WebGL / Three.js hero
- DOM-first: headline/CTA render as real HTML before 3D loads; reserve canvas slot (no CLS); dynamic-import three.js after `window.load` so LCP locks onto text.
- Budgets: hero object 50–100k tris, scene <500k, draw calls <50 mobile, `setPixelRatio(Math.min(devicePixelRatio, 2))`, KTX2 textures, Draco geometry, no shadow maps/post-processing on mobile.
- Render on demand (pause offscreen; R3F `frameloop="demand"`) — mobile GPUs thermal-throttle 60→20fps after ~30s sustained.
- Always: static-image fallback + reduced-motion path.

### Canvas image-sequence scroll (Apple AirPods style)
Video → frame stills (Apple: 147 frames) → draw current frame to canvas from scroll progress:
```js
gsap.to(state, { frame: frameCount - 1, snap: "frame", ease: "none",
  scrollTrigger: { trigger: canvas, pin: true, scrub: 0.5, end: "+=3000" },
  onUpdate: () => ctx.drawImage(imgs[state.frame], 0, 0) });
```
Pitfalls: payload (100+ images — WebP/AVIF, preload first frames progressively), canvas × devicePixelRatio for sharpness, `ease: "none"` + snap to integer frames. Alternative: `<video>` + `currentTime` scrub (simpler; needs keyframe-dense encoding to avoid seek-jank).

### Text splitting / reveal
GSAP **SplitText** (free since GSAP 3.13): `SplitText.create(".h1", { type: "lines,words,chars", mask: "lines", autoSplit: true, onSplit: self => gsap.from(self.chars, { yPercent: 110, stagger: 0.02 }) })`. `mask` option = the signature masked line-reveal (lines translate up out of clipped wrappers, stagger 0.08, power4.out). Built-in screen-reader handling; `autoSplit` re-splits on resize.
DIY: wrap words in `inline-block` spans + stagger; add `aria-label` on parent, `aria-hidden` on spans. Pitfalls: splitting breaks ligatures/kerning; wait for `document.fonts.ready` before splitting (FOUC).

### Magnetic buttons / cursor followers
Core primitive — **lerp**: `pos.x += (target.x - pos.x) * 0.15` per rAF frame (0.1–0.2 = smooth lag). Magnetic: inside activation radius, translate button toward cursor proportionally (inner text at different amplitude for depth); on leave, `elastic.out` back.
Rules: pointer-only — gate with `@media (hover:hover) and (pointer:fine)`, never on touch; displacement ≤~30% of button size; keep focus/click affordances for keyboard; respect reduced-motion.

### Smooth scroll (Lenis)
De-facto standard (~3KB); wraps native scroll so sticky/anchors/a11y keep working. GSAP integration: `lenis.on('scroll', ScrollTrigger.update)` + drive via `gsap.ticker`. Tradeoffs: no CSS scroll-snap, Safari caps 60fps, input lag IS the feature — some users hate hijacked scroll. Always disable for reduced-motion; consider disabling on touch (native momentum already good).

## 7. Gesture-driven animation

**Drag with momentum (Motion):**
```jsx
<motion.div drag="x" dragConstraints={ref} dragElastic={0.2}
  dragMomentum whileDrag={{ scale: 1.05 }}
  onDragEnd={(e, info) => { /* info.offset, info.velocity */ }} />
```
- Rubber-banding: displacement beyond bounds damped — iOS formula `b = (1 − 1/(x·c/d + 1)) · d` (c ≈ 0.55), or simple progressive `offset * 0.15–0.5`.
- Momentum: exponential decay (`timeConstant` ≈ 325ms iOS). GSAP: Draggable + InertiaPlugin.

**Swipe dismissal — dual condition:**
```js
const dismissed = Math.abs(info.offset.x) > 100        // positional (~30–50% width)
               || Math.abs(info.velocity.x) > 500;     // velocity px/s — flick wins
// dismiss: spring toward exit WITH release velocity; else spring back to origin
```
- Velocity must override distance (fast short flick dismisses; fast flick back cancels even past threshold).
- iOS "projection" approach: decide from where momentum WOULD land: `projected = position + velocity × 0.175s`.
- `dragDirectionLock` + `touch-action: pan-y` so vertical scroll and horizontal swipe don't fight.
- While finger is down: 1:1 tracking, zero easing. Interpolate secondary properties (opacity/scale) from drag progress.

## 8. Browser support & library landscape (2026)

| Feature | Chrome/Edge | Safari | Firefox |
|---|---|---|---|
| CSS scroll-driven (`animation-timeline`) | 115+ | 26+ | 155+ (new) |
| Scroll-triggered (`animation-trigger`) | 145+ | ✗ | ✗ |
| View Transitions (same-doc) | 111+ | 18+ | 144+ (Baseline) |
| View Transitions (cross-doc) | 126+ | 18.2+ | ✗ (flag) |
| `linear()` easing | 113+ | 17.2+ | 112+ |

Landscape: **GSAP fully free** (incl. SplitText, InertiaPlugin) since 3.13 under Webflow. "Framer Motion" → **Motion** (motion.dev), framework-agnostic + React/Vue. **Lenis** = smooth-scroll default. Rive vs Lottie converging, Rive still leads product-critical interactivity.

**The 2026 pattern: CSS-native for scroll-linked + route transitions; JS libraries for physics, gestures, orchestration.**

## Sources
Chrome/web.dev (performant-parallaxing, scroll-driven-animations, view-transitions, css-linear-easing) · MDN (scroll-driven animations, View Transition API, IntersectionObserver) · GSAP docs (ScrollTrigger, Flip, SplitText, Staggers) · motion.dev docs (transitions, drag, layout) · Josh Comeau (spring physics, linear(), FLIP, scroll-driven) · Maxime Heckel (spring physics, layout animations) · Keith Clark (pure CSS parallax) · Aerotwist/Paul Lewis (FLIP) · CSS-Tricks (FLIP, Apple scroll) · Codrops (magnetic buttons) · Lenis GitHub · Rive docs · dotlottie-web · animations.dev vocabulary · jakub.kr (drag gestures, shared layouts)

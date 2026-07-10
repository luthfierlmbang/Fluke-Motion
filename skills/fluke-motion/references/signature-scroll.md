# Signature Scroll Effects — Award-Site Scroll-Reactive Techniques

Reference for the fluke-motion skill. Read this for the distinctive "how did they do that" scroll behaviors seen on Awwwards/FWA sites: velocity skew, reactive marquees, stacking cards, theme transitions, WebGL scroll distortion, and creative reveals. Basic parallax/ScrollTrigger/scrollytelling live in advanced-techniques.md and storytelling-and-pageload.md — this file is the layer above.

## The one architectural insight (read first)

**Award-tier scroll effects never map scroll directly to a visual property.** Scroll sets a *target*; a lerp/spring/timeScale chases it; the visual reads from the chaser:
```js
lerped = lerp(lerped, target, 0.1);      // per rAF frame
velocity = target - lerped;              // the derivative — second signature input
```
[Lenis](https://github.com/darkroomengineering/lenis) (~3KB, darkroom.engineering) is the industry default source of that lerped value — it exists to keep DOM and WebGL frame-synced on one scroll value. Master lerp + velocity and every technique below is just a mapping choice.

## Table of contents
1. [Velocity skew / stretch](#1-velocity-skew--stretch)
2. [Infinite marquee (reactive, draggable)](#2-infinite-marquee)
3. [Sticky stacking cards](#3-sticky-stacking-cards)
4. [Pin-and-cycle galleries](#4-pin-and-cycle-galleries)
5. [Advanced horizontal sections](#5-advanced-horizontal-sections)
6. [Text highlight on scroll](#6-text-highlight-on-scroll)
7. [Theme/color transitions](#7-themecolor-transitions)
8. [Elastic scroll, snap, SVG path draw](#8-elastic-scroll-snap-svg-path-draw)
9. [WebGL scroll-synced distortion](#9-webgl-scroll-synced-distortion)
10. [Reveals beyond fade](#10-reveals-beyond-fade)
11. [Progress indicators, infinite loop, hero morph, counters](#11-the-rest)

---

## 1. Velocity skew / stretch

**What:** content shears/stretches proportional to scroll speed, snaps back elastically on stop. **Why it works:** adds perceived mass — content "drags behind" input like physical material. Use on portfolio grids, image columns; not on dense reading content.

**Stack:** GSAP ScrollTrigger `getVelocity()` + `quickSetter` · Framer Motion `useVelocity(scrollY)` + `useSpring` · Lenis `e.velocity`.

```js
const proxy = { skew: 0 },
  skewSetter = gsap.quickSetter(".el", "skewY", "deg"),
  clamp = gsap.utils.clamp(-10, 10);
ScrollTrigger.create({
  onUpdate: (self) => {
    const skew = clamp(self.getVelocity() / -400);
    if (Math.abs(skew) > Math.abs(proxy.skew)) {   // only when MORE severe — prevents jitter
      proxy.skew = skew;
      gsap.to(proxy, { skew: 0, duration: 0.8, ease: "power3",
        overwrite: true, onUpdate: () => skewSetter(proxy.skew) });
    }
  }
});
```
Variants: `skewX`, `rotate`, `scaleY` stretch (cap 1.05–1.1 — non-uniform scale distorts faces), letter-spacing, velocity→blur.

**Pitfalls:** always clamp (fast flicks produce absurd shears); the "only-if-more-severe + overwrite" guard is what prevents self-fighting tweens; apply to a wrapper, not hundreds of nodes; `force3D: true`.

## 2. Infinite marquee

**What:** endless scrolling strip of text/logos. **Why:** motion-at-rest — the page feels alive without input. **The award version reacts to scroll:** speeds up with velocity, reverses with direction.

**Key insight: never animate position from scroll — modulate `timeScale` of an autonomous loop** (negative timeScale = reverse):
```js
const tl = gsap.timeline({ repeat: -1 }).to(track, { xPercent: -50, ease: "none", duration: 20 });
ScrollTrigger.create({
  onUpdate(self) {
    gsap.to(tl, { timeScale: self.direction * gsap.utils.clamp(1, 6, Math.abs(self.getVelocity()) / 300),
                  duration: 0.3, overwrite: true });
    gsap.to(tl, { timeScale: self.direction * 1, duration: 1, delay: 0.3 }); // ease back to base
  }
});
```
- Seamless loop: duplicate content, track `xPercent: 0 → -50` (use `xPercent` not px — sub-pixel rounding causes seam flicker). GSAP `horizontalLoop` helper is the robust version.
- Draggable + momentum: GSAP Draggable + InertiaPlugin around the loop (Osmo publishes a ready component).

**Pitfalls:** duplicated content = duplicated screen-reader output — `aria-hidden="true"` on clones; auto-motion >5s needs pause control (WCAG 2.2.2) — halt under reduced-motion minimum; pause-on-hover must preserve direction.

## 3. Sticky stacking cards

**What:** cards pin and slide over each other; buried cards scale down and dim — a card deck you flip through by scrolling. **Why:** compresses a feature list into one viewport of attention; each card gets a "moment."

**Mechanism is mostly CSS:** every card `position: sticky; top: calc(10vh + i * 25px)` inside a tall container — stacking is free; JS adds only the scale-behind polish.
```jsx
// Framer Motion (Olivier Larose pattern), card i of n:
const scale = useTransform(scrollYProgress, [i / n, 1], [1, 1 - (n - i) * 0.05]);
<motion.div style={{ scale, top: `calc(10vh + ${i * 25}px)` }} className="sticky" />
```
GSAP variant: per-card `pin: true, pinSpacing: false` + scrub tween scaling the previous card.

**Pitfalls:** any ancestor `overflow: hidden` silently kills sticky (the #1 support question); scaled text goes blurry mid-transform; clamp card height ~85svh on mobile; z-index increases with index; ensure keyboard focus scrolls a buried card into its proper "moment."

## 4. Pin-and-cycle galleries

**What:** an image/device pins center-screen while scroll swaps its content through N states; text scrolls past. The backbone of product-feature storytelling. **Pattern:** container height `N * 100vh`, inner `sticky top-0 h-screen`, `activeIndex = floor(progress * N)`, animate swaps (crossfade/clip/scale). **Pitfalls:** preload all N images; hold the last state slightly longer (users overshoot).

WebGL-tier versions (Codrops): on-scroll revealing WebGL images (R3F), OGL rotating infinite gallery, scroll-reactive 3D gallery with images on a Catmull-Rom spline + per-image palette recoloring the background.

## 5. Advanced horizontal sections

Beyond the basic pin+translate — the award version layers three things:
```js
const tween = gsap.to(panels, { xPercent: -100 * (panels.length - 1), ease: "none",
  scrollTrigger: { trigger: container, pin: true, scrub: 1,
    end: () => "+=" + container.offsetWidth,                       // function → resize-safe
    snap: { snapTo: 1 / (panels.length - 1), duration: 0.3 } } });
// nested triggers INSIDE the horizontal movement:
gsap.from(".panel-3 h2", { y: 80, opacity: 0,
  scrollTrigger: { trigger: ".panel-3", containerAnimation: tween, start: "left center" } });
```
`containerAnimation` is the key API. Per-panel parallax = same containerAnimation + scrub + x offset.

**Pitfalls:** snap + scrub + Lenis needs the gsap.ticker integration or snapping stutters; DOM order must still read linearly for screen readers; visible focus must auto-advance the tween (`focusin` listener); background-color changes across panels need paired `onEnter/onLeaveBack`.

## 6. Text highlight on scroll

**What:** large dim paragraph; words fill to full color sequentially as you scroll — reading pace scrubbed to scroll. Ubiquitous on 2023–2026 SOTD sites. **Why:** forces reading rhythm, makes a manifesto feel cinematic.

Three mechanisms:
1. **SplitText + stagger:** words → `gsap.to(words, { opacity: 1, stagger: 0.1, scrollTrigger: { scrub: true } })`
2. **Gradient trick (no split, sub-word continuous fill):** `background: linear-gradient(currentColor, currentColor); background-size: 0% 100%; background-clip: text; color: transparent` over a dim base — scrub `background-size` to 100%
3. **Pure CSS 2025+:** the same keyframe with `animation-timeline: view()`

Highlight-marker variant: background span `scaleX: 0 → 1`, `transformOrigin: "0% 0%"` behind each word.

**Pitfalls:** splitting breaks screen-reader word flow — SplitText `aria: true` or keep an sr-only intact copy; keep the scrub range short (~1 viewport) — scrub-locked reading frustrates fast readers; `background-clip: text` needs `-webkit-` prefix.

## 7. Theme/color transitions

**What:** whole page theme (bg + text + chrome) crossfades per section — the site feels like continuous rooms. Locomotive house style. **The professional mechanism: tween CSS custom properties, not elements:**
```js
document.querySelectorAll("[data-bg]").forEach(section => {
  ScrollTrigger.create({
    trigger: section, start: "top 50%", end: "bottom 50%",
    onToggle: (self) => self.isActive && gsap.to("html", {
      "--bg": section.dataset.bg, "--fg": section.dataset.text,
      duration: 0.6, ease: "power2.out", overwrite: "auto" })
  });
});
```
Everything consuming the tokens follows automatically. Continuous variant: `gsap.utils.interpolate(colorA, colorB)(progress)` or Framer Motion `useTransform` (interpolates colors natively). Pure CSS: `@property --bg { syntax: '<color>' }` + `animation-timeline: scroll()`.

**Pitfalls:** verify WCAG contrast at every interpolated *midpoint*, not just endpoints; fixed headers must consume the same variables (or escape via `mix-blend-mode: difference`); toggle-with-duration feels better than scrub for discrete sections; `overwrite: 'auto'` debounces double-fires.

## 8. Elastic scroll, snap, SVG path draw

- **Elastic/rubber-band:** Lenis's lerp inherently overshoots slightly; for true edge rubber-band, clamp the target and animate a decorative offset with elastic ease. **Keep actual scroll native** (Lenis's whole thesis) — transform-based fake scroll breaks anchors, find-in-page, scroll restoration.
- **Snap done well:** native `scroll-snap-type: y proximity` (never `mandatory` when sections can exceed viewport — traps content); GSAP `snap: { snapTo: 'labels', directional: true }` for pinned scenes where native snap can't reach.
- **Scroll-linked SVG path draw** (journey line connecting sections): dasharray/dashoffset = `getTotalLength()`, scrub to 0; `MotionPathPlugin` moves a marker along the same path at the same progress. Measure after layout; re-measure on resize; dashed source strokes conflict (mask a dashed path with a drawn solid one).

## 9. WebGL scroll-synced distortion

**What:** DOM images re-rendered as WebGL planes whose vertices/UVs warp with scroll velocity — bulge, RGB-shift, curl. At rest it's plain HTML; in motion it's liquid. The Studio Freight/darkroom signature, and the single strongest "how did they do that" signal.

**Architecture** (extends the DOM↔WebGL recipe in creative-effects.md):
1. Real HTML images laid out normally (SEO/a11y intact), hidden
2. Per image: a plane sized from `getBoundingClientRect()` — **cache rects, offset by scroll delta, re-measure only on resize** (per-frame rect reads = layout thrash)
3. Shader takes a `uVelocity` uniform (lerp the uniform too, or it flickers):
```glsl
pos.z += sin(uv.y * PI) * uVelocity * 0.02;                       // vertex: bulge/curl
float r = texture2D(uTex, uv + vec2(0., uVelocity * 0.001)).r;    // fragment: RGB shift
```
4. `uVelocity` = lerped `lenis.velocity`

**Stack:** Three.js / OGL (lighter) / curtains.js; React: R3F + drei ScrollControls or `@14islands/r3f-scroll-rig`.

**Pitfalls:** clamp DPR ≤ 2; CORS on textures; broken WebGL = blank page — feature-detect and fall back to visible HTML; **disable entirely under reduced-motion** (velocity distortion is a top vestibular trigger).

## 10. Reveals beyond fade

| Technique | Mechanism | Notes |
|---|---|---|
| **Clip-path curtain** | `clip-path: inset(0 100% 0 0)` → `inset(0)`; center-open `inset(0 50%)` → 0; pair with inner image counter-scale (1.3→1) for the "window" feel | GPU-friendly; editorial elegance |
| **Blur-to-focus** | `filter: blur(12px)` → 0 + slight scale | radius ≤ ~16px, few elements; never scrub blur on hero-size images |
| **3D rotate reveal** | parent `perspective: 1000px`, child `rotateX(25deg) translateY(80px)` → 0 | text rasterizes blurry mid-transform |
| **Line-mask text** | overflow-hidden wrapper per line, inner span `y: 100% → 0` staggered — SplitText `type: "lines", mask: "lines"` automates | the overflow mask (not opacity) is what reads premium; re-split on resize |
| **Pixelation load-in** | canvas: redraw at increasing resolutions, `imageSmoothingEnabled = false`, 5–7 discrete steps | the steppiness IS the aesthetic; fashion/brutalist |

All reveals: `once: true` — re-triggering on scroll-up reads as broken. Author content visible, animate *from* hidden via JS (`gsap.from`) so JS failure never hides content.

## 11. The rest

- **Progress indicators:** circular SVG ring (dashoffset scrubbed — pure CSS possible via `animation-timeline: scroll(root)`); path-following marker (MotionPathPlugin + scrub); morphing per-section indicator (Framer Motion `layoutId` dots is the robust simple version). Always `aria-hidden` — decoration, never the only wayfinding.
- **Infinite looping page:** Lenis `infinite: true` + duplicated first section (wrap is invisible), or GSAP seamlessLoop + scrollbar-reposition proxy. Breaks scrollbar meaning, End key, find-in-page, deep links — gallery/index pages only, `aria-hidden` the clone.
- **Hero → content morph:** hero pins, scales to fullscreen at apex, then shrinks into the flow — the "one continuous shot" opener. Prefer `scale` on an oversized element + `overflow: hidden` clip (or clip-path expansion) over animating width/height (layout per frame). Ship the image at fullscreen resolution; `svh` units + debounced `refresh()` for iOS URL-bar.
- **Scroll counters:** trigger-fired count-up (1–2s on enter, `once: true`) beats scrubbed — scrub makes stats feel like sliders, not facts. `font-variant-numeric: tabular-nums` or digits jitter.
- **Scrubbed video:** seeking non-keyframes = decoder jank. Fix at encode time: `ffmpeg -g 5 -keyint_min 5` (Firefox needs ~every 2 frames); or WebCodecs decode-ahead into canvas (the high-end answer). Image-sequence (advanced-techniques.md) remains the reliability king.

## Cross-cutting contract

1. **`gsap.matchMedia('(prefers-reduced-motion: no-preference)')`** wraps everything here — auto-reverts when the query flips. Under reduce, content must be visible immediately, not waiting on triggers.
2. One RAF loop: `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(t => lenis.raf(t * 1000))` — never two competing loops.
3. `quickSetter`/`quickTo` for per-frame writes; `ScrollTrigger.batch` for grids; debounce `refresh()`.
4. Transforms/opacity/clip-path only; pinned scenes need `focusin` handlers for keyboard.

## Named references
darkroom.engineering (Lenis, velocity-uniform WebGL) · Locomotive (theme-shift house style) · Active Theory (velocity-reactive nav, WebGL storytelling) · Basement Studio (hero-morph pinned scenes) · Felicity Ingram site (pixelation reveal origin) · Tutorials: Codrops scroll tag, Olivier Larose blog (React/Framer versions of every pattern), Osmo supply, Motion.dev tutorials, GSAP forums (canonical skew/marquee threads), Jhey Tompkins "Going Meta GSAP" (infinite scroll failure modes)

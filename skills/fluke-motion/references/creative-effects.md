# Creative Effects — SVG Animation, Shader/WebGL Image Effects, 3D CSS & Tilt

Reference for the fluke-motion skill. Read this for self-drawing logos, icon/blob morphs, gooey effects, hover image distortion, WebGL sliders, animated gradients, card flips, tilt cards, and holographic effects. These are brand/showpiece techniques — the purpose test still applies, and every one of them needs a reduced-motion and fallback path.

## Table of contents
1. [SVG line drawing](#1-svg-line-drawing)
2. [SVG path morphing](#2-svg-path-morphing)
3. [Animated icons & SVG gotchas](#3-animated-icons--svg-gotchas)
4. [SVG filters: gooey & turbulence](#4-svg-filters-gooey--turbulence)
5. [SVG performance](#5-svg-performance)
6. [Shader / WebGL image effects](#6-shader--webgl-image-effects)
7. [3D CSS: flip, tilt, depth](#7-3d-css-flip-tilt-depth)
8. [Decision cheatsheet](#8-decision-cheatsheet)

---

## 1. SVG line drawing

**The modern no-JS pattern — `pathLength` normalization:**
```html
<path d="..." pathLength="100" />
```
```css
path { stroke-dasharray: 100; stroke-dashoffset: 100; animation: draw 2s ease forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
```
`pathLength="100"` normalizes any path to 100 units — no `getTotalLength()` decimal soup, trivial multi-path staggering via `animation-delay`.

**JS variant (exact lengths):** `path.getTotalLength()` → set dasharray/dashoffset → force layout with `getBoundingClientRect()` (NOT `offsetWidth` — unreliable on SVG in Firefox) → transition dashoffset to 0.

**Scroll-linked draw:** CSS `animation-timeline: view()` + `animation-range: entry 0% cover 60%` (progressive enhancement), or GSAP DrawSVG + ScrollTrigger `scrub` for cross-browser.

**GSAP DrawSVG** (free since 3.13): `gsap.from('.path', { drawSVG: 0 })`; values describe the visible segment end-state (`"20% 80%"`); strokes only, never fill; iOS Safari renders `<rect>` strokes wrong — convert to path.

Pitfalls: dashed-by-design strokes conflict (dasharray is hijacked); `vector-effect: non-scaling-stroke` changes lengths; text-as-path = each glyph its own path.

## 2. SVG path morphing

- **GSAP MorphSVG** — free since 3.13 (all Club plugins free after Webflow acquisition). No same-point-count requirement. `gsap.to("#a", { morphSVG: "#b" })`; fix kinks with `shapeIndex` or `type: "rotational"`; `MorphSVGPlugin.convertToPath("circle, rect")` first (morph needs `<path>`); `precompile` for startup perf.
- **Flubber** (MIT) — framework-agnostic interpolator for non-GSAP stacks; pairs with Framer Motion `useTransform` or D3.
- **CSS `d: path()`** — hover-morph in pure CSS, but requires identical command count/order AND **still no Safari support (2026)** — progressive enhancement only. SMIL `<animate attributeName="d">` works everywhere SVG does (same command-count constraint).
- **Blob backgrounds:** cheapest = animated `border-radius` on a div (`30% 70% 70% 30% / 30% 30% 70% 70%` keyframed) — full support, GPU-friendly. Escalate to SVG morph, then shader noise.

Pitfall: morphing many-point paths per frame is main-thread CPU work — keep concurrent morphs low.

## 3. Animated icons & SVG gotchas

- **SMIL is NOT deprecated** — Chrome reversed the 2015 deprecation; usage growing. Unique strength: animation travels with the file (works in `<img>`, CSS backgrounds, READMEs). Weakness: not compositor-driven (~20 simultaneous SMIL animations can drop frames), no reduced-motion hook.
- **Icon micro-animation pattern:** stroke icon (24×24, stroke-width 2), trigger on parent hover/focus, semantic motion (bell rings via rotate at top-center origin, heart pulses, download arrow line-draws). React: `<motion.path animate={{ pathLength: 1 }} />`.
- **THE transform-origin gotcha** — SVG default reference box is the whole viewBox, origin top-left, so `rotate(45deg)` orbits the canvas corner. Memorize the fix pair:
```css
.icon-part { transform-box: fill-box; transform-origin: center; }
```

## 4. SVG filters: gooey & turbulence

**Gooey** (blur + alpha threshold — overlapping shapes read as one blob):
```xml
<filter id="goo">
  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
  <feColorMatrix in="blur" type="matrix"
    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
  <feBlend in="SourceGraphic" in2="goo" />
</filter>
```
Apply to the **container** (with padding bleed), not the shapes. Bigger `stdDeviation` = gooier; higher alpha multiplier = sharper edge. Safari is flaky with `filter: url()` on HTML elements — apply to inline SVG content for reliability.

**Turbulence/displacement** (wavy/hand-drawn/distortion):
```xml
<feTurbulence type="turbulence" baseFrequency="0.01 0.04" numOctaves="2" result="noise"/>
<feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G"/>
```
CSS can't animate filter-primitive attributes — animate via SMIL or rAF setting `seed`/`baseFrequency` (hand-drawn wobble = cycle `seed` at ~4fps). **Animated SVG filters run on CPU** — scope to small elements (a headline, a button); hero-scale versions belong in WebGL.

## 5. SVG performance

- Cheap: CSS `transform`/`opacity` on SVG elements (GPU-composited). Per-frame `transform` *attribute* writes from JS = layout invalidation — use CSS transforms.
- Expensive: animating `d`, geometry attributes, gradients, any `filter` (CPU repaint per frame).
- Node count: thousands of path nodes inflate style-recalc — SVGO, merge paths, `<use>`, or bail to canvas/WebGL for hundreds of independent animated shapes.
- Hierarchy: CSS transform/opacity → WAAPI → GSAP → SMIL (small ambient) → animated filters (sparingly) → per-frame `d` morphs (short, few).
- Gate off-screen animation with IntersectionObserver + `animation-play-state: paused`.

## 6. Shader / WebGL image effects

### The universal architecture (DOM ↔ WebGL sync)
1. One fixed fullscreen canvas. Camera calibrated so 1 world unit = 1 CSS px: `camera.fov = 2 * atan((viewportHeight/2) / z) * 180/π`.
2. Per image: `getBoundingClientRect()` once (+ ResizeObserver), hide the DOM `<img>` with `visibility: hidden` (keeps layout/a11y/SEO — and it IS the fallback), create a matching plane.
3. Scroll = cached-offset translation, never per-frame rect reads.
4. **Mouse → uniform via lerp** — the universal smoothing idiom: `mouse.x = lerp(mouse.x, target.x, 0.1)` (0.08–0.15); velocity = lerped delta; falloff in-shader via `smoothstep(radius, radius - smoothness, distance(vUv, uMouse))`.

curtains.js / gpu-curtains / r3f-scroll-rig are prebuilt versions of steps 1–3.

### Hover distortion (the canonical shader)
```glsl
vec4 dispTex = texture2D(disp, uv);                       // grayscale displacement map
vec2 pos1 = uv + dispFactor * dispTex.r * intensity;      // dispFactor: 0→1 GSAP tween
vec2 pos2 = uv - (1.0 - dispFactor) * dispTex.r * intensity;
gl_FragColor = mix(texture2D(tex1, pos1), texture2D(tex2, pos2), dispFactor);
```
Swapping the displacement PNG (clouds/stripes/radial) changes the whole look — cheapest variety. Velocity-driven RGB shift: sample R/G/B at slightly different mouse-velocity offsets.

### Sliders & transitions
**gl-transitions** (gl-transitions.com): 100+ open transitions as pure GLSL functions (`transition(uv)` with `progress`, `getFromColor/getToColor`); adapt into any fullscreen-quad pass. Popular: `morph`, `directionalwarp`, `ripple`, `crosszoom`. Preload + pre-upload both textures before transitioning (first-use upload = jank frame).

### Gradients & liquid
- Stripe-style flowing gradient: **whatamesh** (~10KB, Stripe-derived) or shadergradient.co (R3F/Framer). Core = fullscreen quad + layered simplex noise driving color mix.
- Liquid distortion without GLSL: PixiJS `DisplacementFilter` + animated noise sprite.
- Ripple: `sin(dist * freq − time * speed) * amplitude * falloff` on UVs; drive uniforms with GSAP (`gsap.to(uniforms.uProgress, { value: 1, ease: "power3.out" })`).

### Library choice 2026
**ogl** (~24KB, zero deps) for image effects/sliders where you write shaders anyway · **three.js** (~150KB+) for complex scenes needing loaders/ecosystem · **curtains.js** for the fastest DOM-plane on-ramp · **gpu-curtains** = its WebGPU successor, actively developed · **PixiJS** for 2D filters without writing GLSL.

### Discipline (non-negotiable)
- WebGL **does fail** (privacy settings, GPU blocklists, context loss) — feature-detect, handle `webglcontextlost`, and the hidden DOM `<img>` is the fallback: just don't hide it.
- `prefers-reduced-motion` = skip the GL layer entirely.
- **Render-on-demand:** only run rAF while a tween/lerp is active (`Math.abs(target - current) > 0.001`); pause on `visibilitychange` and off-screen (IntersectionObserver); `setPixelRatio(Math.min(devicePixelRatio, 2))`; 30fps cap for ambient backgrounds. A 60fps loop drains mobile batteries and thermal-throttles into jank.
- Hover doesn't exist on touch — map to scroll/touch or disable.

## 7. 3D CSS: flip, tilt, depth

### Card flip
```css
.scene { perspective: 800px; }                    /* perspective on the PARENT */
.card  { transform-style: preserve-3d; transition: transform 0.8s; }
.card.is-flipped { transform: rotateY(180deg); }
.face  { position: absolute; inset: 0; backface-visibility: hidden; }
.face--back { transform: rotateY(180deg); }
```
Without `preserve-3d` on `.card`, faces flatten and the flip breaks. Realism upgrade: add a mid-keyframe lift (`translateZ`/scale bump) — real cards lift as they flip.

### Cursor tilt
```js
// pointer position → target rotation; lerp per frame for weight
targetRX = (py - 0.5) * -2 * MAX;   // MAX 10–25°
targetRY = (px - 0.5) *  2 * MAX;
el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
```
Values: max tilt 10–25°, perspective 800–1200px, scale 1.02–1.05, leave-reset ~300–500ms `cubic-bezier(.03,.98,.52,.99)`. Drop-in: vanilla-tilt.js (~8.5KB, gyroscope support). Glare: pointer-positioned `radial-gradient` on a `::before`, opacity scaled by tilt. Holographic/foil state of the art: simeydotme's pokemon-cards-css (custom properties → rotation + `mix-blend-mode: color-dodge` foil layers).
Rules: `pointermove` not `mousemove`; transforms only (no per-frame box-shadow — paint storm; animate a pre-rendered pseudo-element shadow's opacity instead); gate with `@media (hover:hover) and (pointer:fine)`.

### Depth inside a card
Children at `translateZ(60px)`/`translateZ(100px)` inside the tilting `preserve-3d` card = real parallax, no extra JS. Size compensation: element at Z is magnified by `p/(p−z)` — pre-scale by the inverse.

### THE flattening trap (saves projects)
Any **grouping property** on an element forces `transform-style: flat`, silently killing children's 3D:
`overflow` ≠ visible (incl. `border-radius` + clip) · `opacity < 1` · `filter`/`backdrop-filter` · `clip-path`/`mask` · `mix-blend-mode` · `contain: paint`.
Debug "my 3D collapsed" → hunt the ancestor chain for these. Workarounds: move the property to an inner wrapper; or fake depth with 2D per-layer `translate()` offsets (immune to flattening, visually similar at small tilts).

**Z-fighting:** coplanar faces flicker — separate by ≥0.5–1px `translateZ`. **Perspective feel:** 800–1200px natural; 400–600px dramatic; >1500px near-isometric; <300px fisheye. Per-card perspective for grids (shared perspective skews edge cards). Each 3D element = a compositor layer — dozens on mobile exhaust tile memory.

## 8. Decision cheatsheet

| Want | Reach for |
|---|---|
| Self-drawing logo | `pathLength="100"` + CSS keyframes; DrawSVG for scrub/sequencing |
| Icon state morph | CSS `d:path()` w/ JS fallback, or MorphSVG for arbitrary shapes |
| Blob background | border-radius keyframes → SVG morph → shader noise (escalation) |
| Menu/loader goo | SVG goo filter on inline SVG, small area only |
| Hover image warp | ogl/curtains plane + displacement texture; DOM img as fallback |
| Slider transitions | gl-transitions snippet in a fullscreen-quad pass |
| Animated gradient | whatamesh (~10KB) or shadergradient |
| Card flip/tilt/holo | Pure CSS + pointer custom properties; vanilla-tilt drop-in |
| Depth in card | translateZ layers (no clipping) or 2D translate fake (clipping needed) |

## Sources
CSS-Tricks (SVG line animation, pathLength trick, gooey, animate path changes, CSS 3D gotchas) · Jake Archibald (animated line drawing) · GSAP docs (DrawSVG, MorphSVG, 3.13 release) · Smashing (SMIL's Not Dead, displacement deep dive) · MDN (transform-box, transform-style, d property) · Codrops (WebGL distortion 2018/2020, liquid distortion, image transitions 2019/2025, GSAP shaders 2025, gooey effects, OGL mouse trails) · gl-transitions · curtains.js / gpu-curtains · ogl · alexharri WebGL gradients · Bram.us Stripe gradient · whatamesh · 14islands progressive enhancement · DeSandro 3D transforms · Josh Comeau (Folding the DOM) · Frontend Masters (Deep Card Conundrum, glowing hover) · vanilla-tilt · pokemon-cards-css · Keith Clark pure CSS parallax · Taylor Hunt / crmarsh SVG performance

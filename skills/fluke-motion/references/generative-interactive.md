# Generative & Interactive Effects — Fluid, Particles, Physics, Stylized Shaders, Spatial

Reference for the fluke-motion skill. Read this for WebGL fluid simulation, particle systems, metaballs, reactive dot grids, ASCII/dither/halftone stylization, glitch/grain, physics playgrounds, infinite draggable canvases, and interactive 3D. WebGL heroes and basic shader hover effects live in creative-effects.md — this is the experimental/generative layer above.

**Universal a11y baseline for everything here:** one system-level `prefers-reduced-motion` gate that swaps every effect to its static end-state · `aria-hidden` on all decorative canvases · real DOM text under any canvas-rendered text · pause loops on `visibilitychange` + IntersectionObserver · no effect may be the only path to content.

## Table of contents
1. [WebGL fluid simulation](#1-webgl-fluid-simulation) · 2. [GPGPU particles](#2-gpgpu-particles) · 3. [Constellation networks](#3-constellation-networks) · 4. [Metaballs](#4-metaballs) · 5. [Reactive dot grids](#5-reactive-dot-grids) · 6. [ASCII rendering](#6-ascii-rendering) · 7. [Dithering & halftone](#7-dithering--halftone) · 8. [Grain, VHS, glitch, aberration](#8-grain-vhs-glitch-aberration) · 9. [Pixelation & duotone](#9-pixelation--duotone) · 10. [Physics playgrounds](#10-physics-playgrounds) · 11. [Infinite draggable canvas](#11-infinite-draggable-canvas) · 12. [Inertia carousels & elastic elements](#12-inertia-carousels--elastic-elements) · 13. [Interactive 3D: Spline, R3F, Bruno Simon](#13-interactive-3d) · 14. [Scroll 3D: exploded views & sticky morphs](#14-scroll-3d) · 15. [Depth-map parallax (2.5D)](#15-depth-map-parallax)

---

## 1. WebGL fluid simulation

**What:** GPU Navier-Stokes solver; cursor injects colored dye + velocity → swirling smoke/ink that curls and dissipates. Canonical: Pavel Dobryakov's WebGL-Fluid-Simulation (16k+ stars, mobile-capable). **Why:** highest wow-per-pixel of any cursor effect — feels alive and generative (every visit unique). Hero background/404 moment for premium organic brands; wrong for content-dense pages.

**Mechanism:** fragment passes — advection → curl → vorticity → divergence → pressure Jacobi (~20 iters) → gradient subtraction, ping-pong FBOs; sim at 128–256px, dye at 512–1024px (decoupled from canvas resolution).

**Stack:** original repo (check license — newer versions changed terms); npm wrappers `webgl-fluid-enhanced`, `react-webgl-fluid`.

**Pitfalls:** pressure iterations dominate — drop to 10–20 on mobile; check `OES_texture_half_float_linear` on iOS; **pause the rAF when idle + page hidden** (continuous sim drains battery); text over fluid needs a contrast scrim (colors unpredictable); reduced-motion → static gradient.

## 2. GPGPU particles

**What:** 65k–1M+ points assembling into a logo/text/image/model, then dispersing or reacting to cursor (attract/repel/swirl). Signature of Active Theory / narrative WebGL sites. **Why:** particles forming meaning then dissolving communicates *transformation* — brand reveals, section transitions, identity moments.

**Mechanism:** positions+velocities in float textures; simulation fragment shader updates per frame (ping-pong); render pass reads positions via texture fetch in the vertex shader. Targets sampled from text canvas / image luminance / mesh surface; forces = spring-to-target + curl noise + pointer repulsion:
```glsl
vec3 toTarget = target.xyz - pos.xyz;
vel.xyz += toTarget * spring + curlNoise(pos.xyz * freq) * turb;
vec3 fromMouse = pos.xyz - mouse3d;
vel.xyz += normalize(fromMouse) * strength / (1.0 + dot(fromMouse, fromMouse));
vel.xyz *= damping; pos.xyz += vel.xyz;
```

**Stack:** Three.js `GPUComputationRenderer` · WebGPU compute + TSL (the 2025+ path, replacing ping-pong hacks) · R3F + drei `useFBO` · three-nebula (designer-driven, JSON-exportable).

**Pitfalls:** count = sim-texture size² (256² = 65k, 512² = 262k); additive blending avoids transparency sorting; mobile GPUs choke on vertex-shader texture fetch — smaller sim texture fallback; heavy spawn work → WebWorker (Active Theory pattern); particles forming *text* need real DOM text underneath.

## 3. Constellation networks

**What:** drifting dots with lines between near pairs; cursor attracts or acts as an extra node. The particles.js aesthetic — now a tech/AI cliché but constantly requested. **Why:** reads "network/connectivity/data" — dev tools, AI, fintech. Differentiate via polygon masks (particles constrained to a logo) or 3D depth, or it looks 2015.

**Stack:** tsParticles (TS successor to abandoned particles.js; React/Vue/Svelte components; links, polygon mask, attract/repulse built in). Config-driven: `links: { distance: 150 }`, `onHover.mode: "grab" | "repulse"`.

**Pitfalls:** link-drawing is O(n²) — cost explodes past ~150 particles (official guidance: start at 50); canvas 2D is CPU-bound — cap devicePixelRatio; `pauseOnBlur` + reduced-motion wiring.

## 4. Metaballs

**What:** organic blobs merging/separating like mercury; cursor can absorb/split blobs. **Why:** the merge moment is inherently satisfying — organic/playful brands, hero orbs, gooey nav indicators.

**Three tiers:** SVG goo (2D, creative-effects.md §4) → 2D shader (sum inverse-square fields, threshold) → **3D raymarched SDF** (the glossy Codrops droplet look):
```glsl
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.);
  return mix(b, a, h) - k * h * (1. - h);
}
float map(vec3 p) { float d = 1e9;
  for (int i = 0; i < N; i++) d = smin(d, length(p - ball[i].xyz) - ball[i].w, 0.4);
  return d; }
```
**Pitfalls:** cap march steps (~64), render at half resolution + upscale, ≤8–12 spheres; `smin` k too large = mush, too small = no merge; **slow constant undulation is exactly what vestibular users struggle with** — reduced-motion freezes it.

## 5. Reactive dot grids

**What:** regular dot grid deforming near the cursor — magnetic pull, springy snap-back, click shockwaves rippling outward. **Why:** structured minimalism + physics = "engineered playfulness"; decorates dev-tool/studio sites without color noise; distance-stagger produces emergent waves from trivial math.

```js
for (const dot of dots) {
  const dx = mouse.x - dot.ox, dy = mouse.y - dot.oy, d = Math.hypot(dx, dy);
  if (d < RADIUS) { const f = (1 - d / RADIUS) * PULL; dot.tx = dot.ox + dx * f; dot.ty = dot.oy + dy * f; }
  else { dot.tx = dot.ox; dot.ty = dot.oy; }
  // spring: v += (t - p) * k; v *= damping; p += v;
}
```
Click shockwave: expanding ring radius; dots in the band get radial impulse (GSAP `physics2D`).

**Stack:** canvas 2D + GSAP InertiaPlugin/Physics2D · WebGL instancing >5k dots. **Pitfalls:** DOM-node versions die at ~500 dots — canvas is the real pattern; batch dots in one path per color; squared distance to skip sqrt.

## 6. ASCII rendering

**What:** live scene/image quantized into a character grid — brightness maps to glyph density. The terminal-core aesthetic, exploded 2024–2026. **Why:** signals "technical, crafted, anti-slick" — dev-tool brands and studios differentiating from glossy WebGL. Hover state (image→ASCII), hero (3D as ASCII), preloader.

**Two approaches:** (a) DOM `AsciiEffect` (Three.js addon) — thousands of text nodes, avoid in production; (b) **GPU shader (correct way):** post pass divides screen into cells, samples luminance per cell, indexes a glyph atlas:
```glsl
vec2 cell = floor(vUv * grid) / grid;
float lum = dot(texture2D(tScene, cell).rgb, vec3(.299, .587, .114));
float charIdx = floor(lum * float(NUM_CHARS));
color = sampleGlyphAtlas(charIdx, fract(vUv * grid)) * tint;
```
**Stack:** drei `<AsciiRenderer/>` (R3F) · emilwidlund/ASCII (postprocessing lib) · Codrops "Efecto" (2026 — 8 styles incl. braille, matrix, hatching, procedural glyphs).

**Pitfalls:** SRs may read a DOM ASCII wall — catastrophic; `aria-hidden` + real alt content; low effective contrast — never ASCII-render essential imagery without a toggle; damp temporal changes (character churn flickers).

## 7. Dithering & halftone

**What:** continuous tones quantized through a Bayer threshold matrix (1-bit retro-print) or dot-size modulation (halftone) — often cursor/scroll-reactive. **Why:** THE 2025–26 stylization trend (with ASCII); tactile, risograph-print quality. **Bayer is temporally stable (no shimmer between frames)** — why it's preferred for animation over error-diffusion (Floyd-Steinberg is sequential anyway, can't parallelize).

```glsl
const mat4 bayer = mat4(0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.) / 16.;
float threshold = bayer[int(gl_FragCoord.x) % 4][int(gl_FragCoord.y) % 4];
color = luminance(scene.rgb) > threshold ? palette.light : palette.dark;
// halftone: float d = length(fract(uv * grid) - 0.5); alpha = step(d, dotRadius(lum));
```
**The pro trick: render the source at ¼ resolution, dither, upscale nearest-neighbor** — chunkier authentic pixels AND 4× savings. **Pitfalls:** 1-bit destroys mid-tone contrast — never dither UI text; moiré on non-integer scaling — snap to integer pixel ratios; reduced-motion static frame.

## 8. Grain, VHS, glitch, aberration

**What:** analog corruption as post-processing — animated grain, RGB channel splitting, scanlines, tape-tracking glitches. Often velocity-reactive (glitch spikes on fast scroll/transition). **Why:** grain adds filmic richness and hides gradient banding; **glitch bursts are the strongest transition punctuation available.** Full-time VHS = niche (music/fashion/gaming); transient glitch = broadly usable.

**Stack:** `postprocessing` lib (Noise/ChromaticAberration/Glitch/Scanline effects) for three/R3F · DOM fallback: tiling noise PNG + `mix-blend-mode: overlay` + steps() keyframes · CSS aberration via layered text-shadow.

**The one rule: merge grain+vignette+aberration+scanlines into ONE shader pass** (Matt DesLauriers' filmic pattern) — never stack 4 composer passes. Aberration's 3+ texture reads are the expensive part — keep offsets small.

**A11y — highest-risk category here:** rapid glitch flashes approach photosensitive-epilepsy thresholds — **<3 flashes/sec (WCAG 2.3.1), no full-screen luminance jumps**; grain over body text tanks readability; reduced-motion kills glitch entirely, not just softens.

## 9. Pixelation & duotone

- **Pixelation reveal:** images load through progressively finer blocks (64→32→16→native). Stepped, not smooth — the discrete jumps ARE the aesthetic. Three routes: CSS `image-rendering: pixelated` + stepped source swaps (zero WebGL — the Codrops trick) · canvas `imageSmoothingEnabled = false` · shader `uv = floor(uv * n) / n` (needed for cursor-trail pixel-smear variants). Cap total ~800ms; reduced-motion shows final immediately.
- **Duotone/posterize/threshold:** images as two-color gradient maps, dissolving to full color on hover (`hoverProgress` mixed in shader; cursor-proximity spotlight of true color = `1.0 - smoothstep(0., radius, distance(vUv, mouseUv))`). No-JS route: SVG `feComponentTransfer` tableValues. **Why:** enforces brand color discipline over arbitrary photography. Pitfalls: crushes face detail; avoid red/green pairs (CVD); Safari SVG filters are CPU — WebGL for many images.

## 10. Physics playgrounds

**What:** DOM elements (skill tags, pills, logos) fall with gravity, collide, stack, get grabbed and thrown. The "bouncing tags hero." **Why:** converts a boring list into a toy; physics is universally legible — no instructions needed. For *sets of small items*; never long text.

**Mechanism:** Matter.js bodies with `chamfer: { radius: h/2 }` (pill shape) + walls + `MouseConstraint`; **the award-site way: sync real DOM elements to body transforms** (text stays selectable/crisp):
```js
const body = Bodies.rectangle(x, y, w, h, { chamfer: { radius: h / 2 }, restitution: 0.6 });
Matter.Events.on(engine, 'afterUpdate', () =>
  el.style.transform = `translate(${body.position.x - w/2}px, ${body.position.y - h/2}px) rotate(${body.angle}rad)`);
```
Alternatives: planck.js (Box2D), **Rapier** (WASM, much faster).

**Pitfalls:** DOM-sync fine to ~60 elements; **`enableSleeping: true`** or a settled pile burns CPU forever; fixed timestep + accumulator (tunneling on slow frames); pause offscreen; touch: don't preventDefault vertical swipes (scroll trap); content also exists in reading order; reduced-motion = pre-settled static layout.

## 11. Infinite draggable canvas

**What:** boundless 2D plane of images/cards — drag any direction forever, content wraps seamlessly, momentum after release; often zoom + WebGL distortion at velocity. The 2024–26 portfolio-grid signature. **Why:** replaces pagination with spatial *wandering* — serendipitous discovery. The flaw is the feature: no sense of completion — add a minimap or "back to start."

**Mechanism:** virtual camera offset mutated by pointer delta; world positions modulo tile size (`pos = ((world - camera) % tile + tile) % tile - half`); only viewport+margin items rendered (chunk virtualization); inertia = release velocity decayed `*= 0.94` per frame.

**Pitfalls:** never keep offscreen DOM/meshes alive — virtualize; wrap with modulo, don't clone; texture memory is the killer — dispose distant textures, KTX2; **drag-only nav excludes keyboards — arrow-key panning + a linear list fallback is mandatory**; whole-viewport motion is nausea-prone — reduced-motion disables inertia.

## 12. Inertia carousels & elastic elements

- **Throw-to-scroll slider:** GSAP Draggable + InertiaPlugin (`inertia: true`, `snap`, velocity-skew via `onThrowUpdate` → cards "lean into the throw"). **The most accessible baseline is native `overflow-x` + CSS scroll-snap** (momentum, keyboard, SR for free) — reach for Draggable only when the physics feel is the point. Embla Carousel = the middle ground.
- **Elastic line (plucked string):** SVG quadratic Bézier whose control point chases the cursor within a grab threshold, then springs to rest (`dest += (target - dest) * spring; dest *= friction`). Fancy Components ships it.
- **Ropes/chains/lanyards** (the R3F conf-badge trend): Verlet integration + iterated distance constraints — stable, cheap, no forces:
```js
for (p of pts) { const v = p.pos - p.prev; p.prev = p.pos; p.pos += v * damp + gravity; }
for (let i = 0; i < 3; i++) for (c of links) { /* move endpoints to satisfy c.len */ }
```
**Pitfalls:** springs must be dt-scaled or they explode on 120Hz; SVG path re-serialization per frame is the cost — build `d` once per frame or use canvas; springy overshoot on functional elements delays usability — settle <400ms; reduced-motion = critically damped.

## 13. Interactive 3D

- **Spline** (no-code): design in-browser, export `<spline-viewer>` or `@splinetool/react-spline`; event system wires hover/scroll/state without JS. Collapses cost from weeks to hours. Exports are heavy (multi-MB) — lazy-load below fold, thumbnail placeholder.
- **Three.js/R3F bespoke:** justified when 3D *is* the navigation. **Bruno Simon's portfolio** (the reference): drivable toy-car world — Three.js rendering + Cannon.js physics on primitive proxy shapes synced to detailed meshes per frame (`mesh.position.copy(body.position)`). His a11y answer: a "boring version" HTML fallback link.
- **Cursor-following model:** lerp rotation toward pointer in `useFrame` (`rotation.y = lerp(rotation.y, pointer.x * 0.4, 0.08)`) — presence ("it sees you") for mascots/characters. Touch fallback: idle auto-rotation.

**Perf:** Draco/Meshopt compression, KTX2 textures, DPR ≤ 2, R3F `frameloop="demand"` when idle, physics proxies = primitives never trimesh. **A11y:** canvas heroes need text alternatives; handle context loss; pause on blur.

## 14. Scroll 3D

- **Exploded view** (Apple-style engineering storytelling): product separates into components as you scroll — per-part offset vectors (authored in Blender or computed outward from center) tweened by pinned ScrollTrigger scrub. Scroll increment = comprehension increment. Merge materials/atlas — exploded views multiply draw calls.
- **Sticky morphing object:** ONE persistent 3D object pinned behind scrolling sections; at each boundary it morphs (geometry/material/color) so a single hero object narrates the page. **Continuity is the payoff** — the object is the thread, sections are beads. Mechanism: vertex-shader interpolation between two position attributes + mid-morph noise:
```glsl
vec3 p = mix(positionA, positionB, smoothstep(0., 1., uProgress));
p += normal * snoise(p * 3.) * uProgress * (1. - uProgress) * wobble;
```
Equal vertex counts required (re-mesh or sample both to N points). One canvas for the whole page; morphing via uniforms only (never re-upload geometry); pin ≤150vh per morph; reduced-motion = crossfade static renders.

## 15. Depth-map parallax

**What:** single 2D photo given real-feeling depth — grayscale depth map displaces UVs against mouse/gyro so foreground shifts more than background ("Facebook 3D photo"). **Why:** the cheapest possible "3D" — one image + one map; perfect for photography-led sites; subtle rather than showy. AI monocular-depth models (Depth Anything, MiDaS) auto-generate maps — mass-producible.

```glsl
float d = texture2D(uDepth, vUv).r;
vec2 off = uMouse * (d - 0.5) * uStrength;   // focus plane at mid-depth
gl_FragColor = texture2D(uImage, vUv + off);
```
**Pitfalls:** large strength reveals smearing at depth edges (no occluded data exists) — keep ≤~20px equivalent; depth map at ¼ res, slightly blurred; iOS gyro needs `DeviceOrientationEvent.requestPermission` — degrade silently; **constant warping under cursor is a vestibular trigger** — reduced-motion freezes flat; keep the `<img>`+alt fallback.

## Studio playbook notes

- **Active Theory (Hydra engine):** hybrid CPU-spawn/GPU-integrate particles; geometry loading, particle generation, AND physics all in WebWorkers. Generalizable: worker-offload everything possible.
- **2025–26 trend stack:** stylization shaders (ASCII, Bayer, halftone) + spatial navigation (infinite canvas) are the current signature moves; WebGPU compute + TSL replacing GPGPU ping-pong.

## Sources
PavelDoGreat/WebGL-Fluid-Simulation · Codrops (GPGPU dreamy particles, interactive text destruction WebGPU/TSL, droplet metaballs, Efecto ASCII, Bayer dithering, real-time dithering, pixelated loading, pixel distortion, infinite canvas, shape morph on scroll, Rock the Stage, fake-3D depth, WebGPU depth scanning, SVG duotone) · tsParticles · Jamie Wong (metaballs math) · Maxime Heckel (dithering deep-dive) · Matt DesLauriers (filmic effects) · Matter.js + Thrive Digital header · GSAP Draggable/Inertia · Fancy Components (elastic line) · Nathan Gordon (interactive elastic ease) · Spline · Bruno Simon case study (Awwwards/Medium) · DevDojo exploded view R3F · Wawa Sensei R3F scroll · drei AsciiRenderer · Active Theory tech story

# Award Combinations — Full-Site Motion Systems & Orchestration

Reference for the fluke-motion skill. Read this when building a whole site's motion identity (not a single effect): which techniques pair, why they pair, how to orchestrate them into one coherent feel, and when a combination becomes too much. This is the layer that separates "site with animations" from "award site" — juries score the *system*, not individual effects.

## The meta-finding (read first)

Every award-tier motion system converges on the same architecture:

1. **One clock** — `gsap.ticker` (or the R3F loop) is the sole rAF; Lenis, cursor lerp, physics, flowmap, and `renderer.render()` all subscribe. Two clocks = phase drift = "feels off" without users knowing why.
2. **One scroll authority** — either JS owns scroll (Lenis: DOM and WebGL read identical values per frame) or native owns it and GL compensates. Never both.
3. **One interpolation constant** — cursor lerp, Lenis lerp, skew recovery, hover eases all tuned to the same felt latency. This is THE reason a site reads as "one material."
4. **One progress value per composite effect** — tween a single 0→1 float with GSAP, fan it out to shader uniforms + DOM transforms + playbackRate. Timing lives in GSAP, appearance lives in the shader/CSS — changing an ease never touches shader code.
5. **Motion tokens** — a duration scale (e.g. 150/300/600/1200ms), 2–3 named eases, one stagger unit, one lerp factor — codified like color tokens.

Spectacle concentrates in brand moments (preloader, hero, transitions); restraint rules task moments; reduced-motion is a *parallel design*, not an off-switch. The stacks differ — DOM-first, GL-first, type-first, physics-first — but this contract is identical, and the contract is what gets scored.

## Table of contents
1. [The modern awwwards portfolio stack](#1-the-modern-awwwards-portfolio-stack)
2. [WebGL-first agency site](#2-webgl-first-agency-site)
3. [Editorial / scrollytelling](#3-editorial--scrollytelling)
4. [E-commerce / product](#4-e-commerce--product)
5. [Typography-led brand site](#5-typography-led-brand-site)
6. [Playful / toy-like](#6-playful--toy-like)
7. [Orchestration principles](#7-orchestration-principles)
8. [Studio signatures](#8-studio-signatures)

---

## 1. The modern awwwards portfolio stack

**Combo:** Lenis + GSAP (ScrollTrigger/SplitText/Flip) + velocity skew/parallax + custom lerp cursor + page transitions (Barba/Taxi/Swup/View Transitions) + preloader→hero choreography.

**The experience:** everything exists in one continuous, slightly-damped medium — inertial scroll, images lagging and skewing with velocity, masked line reveals, a soft-following cursor that morphs on hover, and zero hard cuts from preloader to final page.

**Why these pair:** all five pieces are built on the *same primitive* — lerp toward a target. Lenis lerps scroll; the cursor lerps toward the pointer; velocity skew is literally the derivative of the lerped scroll; the reveals use decelerating eases (`power3.out`, `expo.out`) that read as the same damped physics. Same decay constant everywhere → one material. Also cheap: no WebGL, works in Webflow, every piece independently documented. Osmo (Snellenberg + van Eck, ~38 combined SOTDs) productized exactly this system.

**The critical sync (memorize this):**
```js
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);   // mandatory — GSAP's lag compensation fights Lenis otherwise
```

**Orchestration:**
- Preloader counter/curtain exit *becomes* the first tween of the hero timeline — one master timeline, overlapped `-=0.3`-style offsets, never strictly sequential ("disconnected animations firing randomly" is the amateur tell).
- Page transition contract: `lenis.stop()` → exit timeline → swap → `window.scrollTo(0,0)` → `ScrollTrigger.refresh()` → `lenis.start()`. Kill old-page ScrollTriggers in beforeLeave.
- The lerp values are the "one material" dial: Lenis `lerp: 0.1`, cursor 0.08–0.15, skew recovery ~0.8s power3.out.

**Combination pitfalls:** double-smoothing (`scrub: 1` on top of Lenis lerp = drunk parallax — one smoothing layer per effect); SplitText without `revert()` nests spans and bloats the DOM ("strictly mandatory" — Arnaud Rocca); cursor on its own rAF is visibly out of phase with scroll inertia; mobile usually disables Lenis smoothing on touch — design for native feel too; smooth scroll + velocity skew is a vestibular stack — `gsap.matchMedia()` reduced-motion branch required.

## 2. WebGL-first agency site

**Combo:** Three.js/OGL/custom renderer + DOM-synced GL planes + scroll-driven camera + shader hover distortion (flowmap) + fluid/particle cursor — ONE fixed canvas, one rAF.

**The experience:** the DOM is a layout/SEO/a11y skeleton; everything visible-and-alive is GPU. Cursor fluid distorts a scrolling image *because they share render targets* — effects visually interact in a way stacked DOM effects never can.

**Why these pair:** once one canvas exists, each additional effect is nearly free compositionally — shared render pipeline = shared frame budget = shared time source = inherent sync. This is the "wow" stack (Lusion, Active Theory, Abeto's Igloo Inc SOTY 2024).

**The single most important orchestration pattern (Thibault Guignand):** every WebGL effect is driven by *one `progress` float tweened by GSAP* and copied to a uniform each frame. Shader is stateless; GSAP owns all motion curves. His carousel drives block-reveal mask + displacement warp + chromatic aberration from one uniform, with parabolic shaping so warp peaks at progress 0.5.

**Key engineering:**
- DOM↔GL sync: JS-driven scroll (Lenis + fixed canvas — drift impossible, main-thread cost) vs native scroll + per-frame transform correction (needs ~25% overdraw). Pick one.
- Frame-rate independence: `Math.pow(config.dissipation, deltaTime * 60)` — or the fluid sim feels completely different at 120Hz.
- Idle guards: suspend flowmap rAF after ~90 frames without input.
- Lusion's philosophy: "you don't need to do everything real-time" — pre-bake in Houdini (cloth sim compressed to 11 keyframes in PNGs, 792KB→246KB); frame counters encoded into video pixels for offline↔realtime sync.
- Igloo Inc: SDF-rendered UI text in WebGL (scramble via texture offsets — cheaper than DOM), staggered shader compilation during preloader, continuous low-end device testing.

**Pitfalls:** mount GL once at app root, swap textures via props — remounting leaks contexts; sync failure feels WORSE than a DOM site ("even at smooth 60fps, any scroll-speed mismatch reads as jank"); blur/fluid passes are the budget-killers — disable blur on mobile, `powerPreference: 'low-power'`; precompile shaders during the preloader, not on first scroll.

## 3. Editorial / scrollytelling

**Combo:** pinned scenes + scrubbed timelines + SplitText line reveals + full-page theme color transitions between chapters + progress rail + occasional horizontal section.

**Why these pair:** narrative pacing drives everything. Pinning converts scroll distance into *time* — dwell-time per beat controlled like film editing. Theme transitions are chapter breaks (cheapest "new act" signal). The progress rail compensates for the disorientation pinning creates. Every technique serves comprehension → juries read it as Content+Design, not decoration. Podium case study: the site was deliberately *slowed down* to mirror its subject; "scroll becomes the storytelling model."

**Orchestration:** theme colors via `onEnter`/`onEnterBack` (discrete, snap-commits to a chapter — scrubbed color sits in muddy in-betweens); one timeline per pinned scene, scroll-distance budgeting = editing rhythm; progress rail from a page-level trigger's `onUpdate(self.progress)` — same source of truth; **reveal text with toggleActions, scrub only imagery** (scrubbed text is unreadable); the color tween must also retheme fixed elements (nav, rail, cursor) or the illusion breaks; transitions use clicked media as the shared object (GSAP Flip) so navigation feels content-connected.

**Pitfalls:** late `ScrollTrigger.refresh()` (fonts/images) mid-read jumps the reader — pre-measure media (ship image dimensions at build); a pinned 300vh section with nothing responding in the first 100-200px reads as "scroll broken."

## 4. E-commerce / product

**Combo:** sticky product gallery + micro-interactions (swatches, hover alt-views, cart feedback) + View Transitions shared-element morphs PLP→PDP + subtle scroll reveals. **Restraint IS the design principle.**

**Why these pair:** commerce motion's job is *state continuity and confidence* — the shared-element morph answers "am I looking at the same product?"; micro-interactions answer "did my action register?". The test for every interaction: "is it helping decision-making or added for its own sake?" Award e-commerce (BSMNT Foundry) explicitly splits the budget: spectacle in brand moments, invisible speed in task flows.

**Orchestration:** micro-interactions at 150–300ms ease-out — deliberately *below* brand-moment durations (600–1400ms) so feedback never competes with narrative; VT morphs: assign `view-transition-name` only to the clicked card at click time (unique names required), React needs `flushSync` inside `startViewTransition`; keep VT <400ms and NEVER on cart/checkout actions (VT freezes interaction during capture).

**Pitfalls:** smooth-scroll hijacking on a store hurts conversion perception — native scroll or barely-there Lenis (`lerp` ≥ 0.15); parallax on product imagery misrepresents the product (editorial zones only); 20 delightful micro-effects on one grid = noise; hover-dependent info needs touch + keyboard equivalents.

## 5. Typography-led brand site

**Combo:** kinetic type hero (SplitText or variable-font axes) + marquee strips + hover-per-letter + oversized display type as layout + minimal palette + scroll-linked type deformation.

**Why these pair:** removing color and imagery concentrates the whole expressive budget into type — and because every effect operates on the same atoms (characters), the site is automatically coherent. Variable fonts make per-letter motion feel *material* (the letterform itself changes) rather than decorative (letters merely move). Marquees supply ambient motion so the page never feels static between actions. Obys (Studio of the Year 2023) is the canon: motion as "an explanatory device," never decoration.

**Orchestration:** per-letter stagger is the master rhythm — the SAME stagger value (0.02–0.05s) and ease for hero build-in, hover ripple, and transitions makes all type one instrument; scroll-coupled marquee timeScale shares Lenis's velocity output; kinetic heroes settle to a legible resting state ≤1.5s; scramble effects pre-lock final string length (layout thrash); gate the hero timeline on `document.fonts.ready` — this is partly what preloaders are *for*.

**Pitfalls:** variable-axis animation re-rasterizes glyphs per frame per char — window to visible/near-cursor chars only; marquees = WCAG 2.2.2 pause requirements + battery; SplitText aria contract every time.

## 6. Playful / toy-like

**Combo:** 2D physics (Matter.js) or 3D (Cannon/Rapier) + draggable/throwable elements + springy cursor + collision sound cues + often a game conceit.

**Why these pair:** physics gives *unscripted* motion — every visit different — the strongest "aliveness" signal. Sound closes the sensorimotor loop (visual+audio agreement makes fake physics feel real); a springy cursor extends the physics material to the pointer, making the toy metaphor total. Trades usability for memorability — right for portfolios/campaigns where the site IS the demo. Bruno Simon's drivable-car portfolio is the genre-definer (Three.js render world + Cannon.js proxy-shape "parallel universe" + Howler.js impact audio).

**Orchestration:** physics steps in the same shared ticker as rendering, fixed timestep + interpolation; sound: collision impulse → volume + playbackRate variance ±10% (repeats must not sound machine-gun identical), audio REQUIRES a user gesture — gate behind the preloader's "Enter", always ship persistent mute; one stiffness/damping pair shared by cursor, draggables, and release inertia = one toy material; **bound the chaos** — physics regions contained (hero, footer, 404) with static walls, the rest returns to Pattern-1 conventions.

**Pitfalls:** body counts in tens not hundreds, sleep resting bodies; touch drag vs scroll needs gesture-intent discrimination; pure toys with no content path plateau at SOTD — Usability is 30% of the score (Bruno ships a "boring version" link).

## 7. Orchestration principles

- **Entrance hierarchy (canonical order):** preloader (masks assets/fonts/shader compile, sets tone, legitimizes the audio-permission gesture) → curtain exit *overlapping* hero build-in (nav → headline lines → media → secondary) → scroll reveals armed only after the hero completes (avoids double-firing above-fold reveals) → ambient layers (marquee, cursor, fluid) fade in last.
- **Effects as tokens (Arnaud Rocca's architecture):** named GSAP effects (`fade`, `colorize`, `scale`) with default eases, composed into composites (`fadeColor`) — the site's entire motion vocabulary is ~a dozen named, reusable effects. This is motion-tokens-as-code.
- **How juries score (Awwwards):** Design 40% / Usability 30% / Creativity 20% / Content 10%. Motion lives in Design+Creativity (60%), but the 30% Usability weight is why spectacle loses to orchestrated restraint. Jurors are working devs — "developer-audience signals" (chromatic aberration, flowmaps, custom shaders) are legible craft markers.
- **When it's too much:** the performance budget is SHARED — blur passes + fluid sim + SplitText chars all bill the same 16.6ms (8ms at 120Hz). Documented mitigations: blur off on mobile, idle-suspend rAF consumers, direct DOM writes bypassing React reconciliation, pre-bake instead of real-time, continuous low-end testing. Cumulative a11y: smooth scroll + parallax + skew + marquee each pass individually; stacked they're a vestibular hazard — reduced-motion as parallel design: keep opacity fades, drop translation/scale/skew, keep Lenis but raise lerp toward 1.
- **The restraint quote that wins awards:** Obys framed their redesign as "removing uncertainty rather than adding ideas"; Utsubo's criteria breakdown warns against "GPU stress test disguised as branding."

## 8. Studio signatures

| Studio/Site | Signature combination |
|---|---|
| **Lusion** | Custom WebGL renderer + pre-baked Houdini sims synced to realtime + WebGL scroll nav + fluid cursor |
| **Active Theory** | Custom Hydra engine + MSDF WebGL text + particles; physics/geometry in WebWorkers |
| **darkroom.engineering** (ex-Studio Freight) | *Created* the Pattern-1 stack: Lenis + GSAP + R3F + Theatre.js |
| **Locomotive** | locomotive-scroll (pre-Lenis standard) + drag-first nav + inertia + theme transitions |
| **basement.studio** | Next + R3F + GSAP brand-moment maximalism with fast task flows |
| **Obys** (SOTY 2023) | Typography-led: custom typeface as system + scroll-inertia type deformation + minimal palette; custom TS/rAF/WAAPI engine, no GSAP |
| **Abeto — Igloo Inc** (SOTY 2024) | All-WebGL: procedural crystals + SDF UI text + frost/chromatic transitions + audio-reactive particles |
| **Bruno Simon** | Drivable-car portfolio: Three.js + Cannon.js + Howler.js |
| **Osmo** (Snellenberg/van Eck) | The productized modern portfolio stack; Vault = 150+ components |

**Gold-list "how we built it" sources:** Codrops Case Study tag (Rocca, Guignand, 4WIDE, Podium, Shopify Everywhere, Obys, Contassot, Spitzer) · Awwwards case studies (Lusion, Igloo, Locomotive, DeSo, BSMNT Foundry, Bruno Simon) · luruke/awesome-casestudy (community index) · Active Theory Medium · JOYCO Hub WebGL scroll-sync log · Lenis README · Osmo Vault.

## Field teardown: digital-culture.valmax.dev

A real, mid-tier instance of the **Pattern-1 modern-portfolio stack** on WordPress — useful because it shows the stack applied *with restraint* (not a maximalist showpiece). Reverse-engineered live (Playwright + bundle source). A playable vanilla recreation lives at `showcase/dc-teardown.html`.

**Stack (all bundled + module-scoped, so `window.gsap`/`window.Lenis` read undefined — detect via `<html class="lenis">` and reading the bundle):** Lenis (smooth scroll) · GSAP + ScrollTrigger · native ScrollTimeline (progressive enhancement) · AOS (fade reveals) · Splitting.js (word-level) · Swiper (fade + slide sliders, autoplay OFF) · a custom draggable carousel with a **contextual cursor** (morphs to DRAG / NEXT / BACK over the slider) · Ukiyo + Lottie present in the bundle but **not applied on the homepage**.

**The seven moves:** (1) Lenis smooth scroll — the highest-leverage single effect, carries most of the "premium" feel; (2) **sticky-pinned stacking panels** — each section pins full-viewport (CSS `position:sticky; top:0; height:100vh` + a `.sticky-spacer` sibling whose height sets the pin duration) while the next DOM section rises up and covers it, and GSAP ScrollTrigger `scrub` (tied to Lenis) drives the *inner* content while pinned — clip-path wipes (`polygon`/`circle`), the capabilities slider (translateX), the industries list (translateY). This stacking-pin + clip-path scrub is the "sections transmorph" feel — **not** a background crossfade and **not** an animated border-radius curtain (verified per-frame: the `<section>`s themselves never transform); (3) fade reveals (opacity, `transform:none`); (4) Splitting word reveal on titles (clip-path per word); (5) interactive industries list — active item highlights + background image follows the selection; (6) draggable insights carousel + the contextual cursor; (7) hover craft (fill-invert buttons ~180–450ms, accordion highlight).

**The pin-stack contract (memorize — this is the reusable primitive):** the pin is *pure CSS* (`position:sticky; top:0; height:100vh` on an inner wrapper + a spacer sibling that provides the scroll length); the *reveal* is a scroll-progress `clip-path`/`transform` on the inner content. GSAP ScrollTrigger `scrub` synced to Lenis is just a convenience over `getBoundingClientRect`-derived progress — the effect works in plain CSS+JS (see `showcase/motion-specimen.html` → "Sticky-pin stacking panels" demo).

**Two lessons (what NOT to copy):**
- **Zero reduced-motion handling** — no `prefers-reduced-motion` in CSS *or* JS (`matchMedia` used only for breakpoints), despite Lenis smooth-scroll being a prime vestibular trigger. A motion-heavy site must ship the reduced-motion parallel + an in-page toggle (the recreation does; the original doesn't).
- **`transition: all` on ~94% of elements** — a base reset (`* { transition: all … }`) that makes the browser watch every property on every node; scope transitions to the properties that actually change.

**Two lessons (what works):** motion inits `onUserInteraction` (defers heavy library boot until first scroll/move — good for load perf); and the motion is **sticky-pin + clip-path-scrub + smooth-scroll driven** (native Lenis scroll, *not* a translated wrapper), not heavy transform-parallax or WebGL — proof that the modern-portfolio "feel" comes mostly from Lenis inertia + CSS-sticky stacking + tasteful clip-path reveals, not GPU effects.

## How to use this file

When a user asks for "a site that feels like awwwards": (1) pick the genre pattern (§1–6) matching their content; (2) apply the meta-contract (§0) — one clock, one scroll authority, one lerp constant, motion tokens; (3) budget spectacle to brand moments only; (4) design the reduced-motion parallel from day one; (5) individual technique details live in the other reference files — signature-scroll.md, signature-cursor-hover.md, kinetic-typography.md, generative-interactive.md.

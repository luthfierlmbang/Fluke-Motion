# Scroll Storytelling & Page-Load Orchestration

Reference for the fluke-motion skill. Read this for narrative/chapter-based scroll sites (scrollytelling), preloaders, hero entrance sequences, and route/page transitions. These are the highest-stakes motion decisions on a site — they interact directly with Core Web Vitals, accessibility, and the NN/g scrolljacking research.

## Table of contents
1. [Scrollytelling architecture](#1-scrollytelling-architecture)
2. [Tool choice: IO vs ScrollTrigger vs native CSS](#2-tool-choice)
3. [Scene transitions & scroll budgeting](#3-scene-transitions--scroll-budgeting)
4. [The scrolljacking line](#4-the-scrolljacking-line)
5. [Mobile & accessibility](#5-mobile--accessibility)
6. [Preloaders](#6-preloaders)
7. [Hero entrance & font loading](#7-hero-entrance--font-loading)
8. [LCP/CLS constraints — the opacity-0 trap](#8-lcpcls-constraints)
9. [Route & page transitions](#9-route--page-transitions)
10. [Session-aware intros](#10-session-aware-intros)

---

## 1. Scrollytelling architecture

**Definition (The Pudding):** content is revealed/changed as the user scrolls — it **monitors scroll without altering it**. That's what separates scrollytelling from scrolljacking.

Canonical DOM structure — CSS does the pinning, JS only does step-triggering:
```html
<section class="scrolly">                       <!-- parent = the scene; bounds the sticky range -->
  <figure class="scrolly__graphic"></figure>    <!-- position: sticky; top: 0 -->
  <div class="scrolly__steps">
    <div class="step" data-step="1">…</div>     <!-- each step 75–120vh min-height -->
    <div class="step" data-step="2">…</div>
  </div>
</section>
```
- Two layouts: side-by-side (desktop) and text-overlay cards over a full-bleed pinned graphic (NYT style — the only variant that works on mobile).
- State handler is a pure function `(stepIndex, direction) => renderState` — **always handle `direction: 'up'`** so scrolling backwards replays correctly. This is the hallmark of production scrollytelling.
- Graceful degradation is free: unsupported browsers show elements static in source order.

## 2. Tool choice

- **Intersection Observer / scrollama** — *discrete state changes*: step enters → swap chart state, crossfade image. Lightest; the default for editorial work. Scrollama: `offset: 0.5` (the trigger line), `onStepEnter/onStepExit` with `{ index, direction }`, optional `progress` mode.
- **GSAP ScrollTrigger** — *continuous scrub + pinning*: video/canvas scrubbing, pinned multi-element timelines, horizontal fake-scroll, snap. Rules from GSAP's own skill docs: **never animate the pinned element — animate its children**; never combine `scrub` and `toggleActions` on one trigger; within a scrubbed timeline, tween durations are *proportions of scroll distance*, not seconds; create triggers top-to-bottom in page order; `ScrollTrigger.refresh()` after fonts/images load; typical feel `scrub: 0.5–1.5`.
- **Native CSS scroll-driven** (`animation-timeline`) — compositor-thread, zero JS: progress bars, reveals, parallax, simple scrub. Firefox still behind flag as of mid-2026 — not yet the sole mechanism for a chaptered narrative; use as progressive enhancement.

## 3. Scene transitions & scroll budgeting

**Transitions between chapters:**
1. **Crossfade pinned layers** — steps toggle which layer is visible (~0.4–0.6s opacity). Cheapest, most robust; the data-journalism default.
2. **Layered/curtain pinning** — sections stacked, each pins while the next slides over it (`pinSpacing: false` on all but last).
3. **Horizontal chapters** — pin outer + tween `xPercent` with mandatory `ease: "none"`; nested triggers via `containerAnimation` (pinning/snapping unavailable inside it).
4. **Zoom-through/pan** (maps): "zoom in once, stay zoomed, pan to follow, zoom out once per scene change" — never oscillate zoom per step.

**Scroll budgeting:**
- Text steps: 75–120vh each. Pinned scrub scenes: `end: "+=100%"` for one beat, `"+=200–300%"` multi-beat, `+=300%`+ only for hero set-pieces.
- Insert empty "rest" segments (`tl.to({}, {duration: 0.25})`) so beats don't land at pin edges.
- Ceiling: pinned scenes beyond ~4–5 viewports without new information trigger the "is this broken?" reaction — break long stories with normal-scroll prose between pinned scenes.

**Progress & affordance:**
- Reading progress bar = 3 lines of CSS scroll-driven animation now.
- **Chapter dot-rail with visible nav** — directly answers NN/g's finding that scrolljacking disorients most when navigation isn't visible. Dots = real anchor links, keyboard-focusable.
- Scroll hint: animated chevron that fades permanently on first scroll, or the **cut-off look** (hero at `min-height: 92–95svh` so the next section peeks) — restores natural scroll affordance without ornament.

## 4. The scrolljacking line

NN/g "Scrolljacking 101" (2024): majority of users experienced disorientation; long scrolljacks read as **bugs**; everything worse on mobile; worst case = altered scroll rate + text that must be read simultaneously.

- **Scrub-pinned GSAP scenes with native scroll physics ≠ scrolljacking** — that's the acceptable modern form. True hijacking = wheel-event interception / mandatory full-page snap (fullPage.js style).
- CSS `scroll-snap: mandatory` on full-page sections inherits the same problems (content taller than viewport becomes unreachable). Use `proximity`, add `scroll-padding` for fixed headers, consider mandatory→proximity under reduced-motion.
- If hijack-adjacent: keep it short, below the fold, no reading load during motion, keep nav visible, skip on mobile. Justify with: *"what meaning is lost if this is removed?"*

## 5. Mobile & accessibility

**Mobile (The Pudding's rules):**
- **Never `vh` in scrollytelling CSS** — mobile URL-bar collapse changes viewport height mid-scroll, moving every trigger. Use `svh` (stable) for pinned scenes, not `dvh` (resizes mid-scroll).
- Side-by-side collapses to text-overlay cards. Keep it scrolly on mobile only when transitions convey change-over-time or spatial movement — otherwise **stack static charts**. Shorter narratives; remove hover interactions; touch targets ≥48px; charts must not capture single-finger pan (traps scroll).

**Accessibility:**
- **Reduced motion = the static article.** Unpin scenes, disable scrub/parallax, present figures inline in source order. GSAP: wrap in `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` so animations never register. Design this on day one, not as retrofit.
- **Source order is the screen-reader path** — the DOM must read as a coherent article with no interaction. Pinned figures get `aria-label` describing final state; don't announce scrub frames.
- Everything keyboard-reachable via native scrolling; "View as text" link before heavy scenes.

## 6. Preloaders

**Justified only when a genuine multi-second payload gates rendering** (WebGL scenes, video heroes). Content/marketing/product sites: no preloader — it's a self-inflicted LCP delay. <1s of load: no looped animation at all.

When justified:
- **Determinate, driven by real loading events** — three.js `LoadingManager.onProgress(url, loaded, total)`; bracket invisible async work with `itemStart/itemEnd`. Never a pure time-based fake counter; acceptable hybrid = real progress with the *displayed* number eased monotonically toward it.
- Minimum display ~0.4–1s to avoid a flash, but never delay interactivity longer than assets require.
- **Loader-out and hero-in are one choreographed timeline**: curtain wipes (`translateY(-100%)` or `clip-path`) while hero entrance starts ~0.2–0.3s *before* the curtain fully clears — overlap = perceived speed.
- Any intro >2–3s needs a visible Skip button.

## 7. Hero entrance & font loading

**Orchestration order:** background/media → logo/nav → headline → sub → CTA → peripherals. One master timeline (GSAP `tl` or `staggerChildren`), not per-element delays.

Values: sibling stagger 0.05–0.2s; delay-between ≈ 30–70% of item duration (overlapping cascade, not a queue); items 0.5–0.9s `expo.out`/`power3.out`; total sequence ≤1.5–2s; headline readable + CTA interactive within ~3s.

**Font coordination — critical for text reveals:**
```js
document.fonts.ready.then(() => {
  SplitText.create("h1", { type: "lines,words", autoSplit: true,
    onSplit: self => gsap.from(self.words, { yPercent: 110, opacity: 0, stagger: 0.04, duration: 0.8, ease: "expo.out" })
  });
});
```
- Splitting before webfonts load = wrong line breaks. Hide the target with `visibility: hidden` (NOT `opacity: 0` if it's the LCP element — §8), reveal inside `fonts.ready`. With `autoSplit: true`, always create tweens in `onSplit` (re-runs on re-split).
- Preload the LCP font; `font-display: swap` + metric-matched fallback (`size-adjust`/`ascent-override`) = zero-CLS swap.

## 8. LCP/CLS constraints

**The opacity-0 trap** — the single most expensive entrance-animation mistake:
- An element rendered at `opacity: 0` registers **no LCP** at initial render; LCP is recorded at its next repaint — a fade-in hero silently inflates LCP by hundreds of ms to seconds (documented −6s LCP fix at Shopify from removing image opacity transitions). Text heroes are the worse case (text updates its reported time on repaint; images keep original startTime).
- Fixes, in preference order:
  1. Don't animate the LCP element's opacity from 0 — animate transform/scale/clip-path with the element visible.
  2. Start at **`opacity: 0.1`** (this makes the initial render an LCP candidate — the documented Chrome workaround; visually indistinguishable).
  3. Paint at full opacity, start the animation after first paint (double-rAF or `load`).
  4. Ensure another large visible element is the LCP candidate.
- **Masked line reveals are LCP-safe** — a headline line starting `translateY(110%)` inside an `overflow: hidden` clip is off-screen but at **full opacity**, so it isn't excluded the way `opacity: 0` is; Chrome records the LCP paint when it slides in, and if the default (no-intro) state is the final resting layout, the text paints immediately for no-JS/repeat visits. This is why masked transform reveals beat opacity fades for hero headlines — the clip is just a static wrapper, the reveal animates only `transform`.
- A full-viewport preloader is excluded from LCP as background — so **preloaders push LCP toward/past 2.5s** by definition.
- **CLS:** entrance movement only via `transform` (composited, not counted). Animating top/left/margin or injecting late hero content without reserved space counts. AOS-style JS that sets `opacity:0 + translate` on above-fold content risks both a flash and the LCP penalty.

**Above-fold ⇒ reveal on load, never on scroll.** Below-fold ⇒ reveal on scroll, forgivingly: trigger at 10–20% visibility, `once: true`, ≤0.6s, distance ≤24–40px — content must never chase a fast scroller. One consistent reveal pattern site-wide; bespoke per-section entrances is the recognized "template smell."

## 9. Route & page transitions

- **MPA: native View Transitions** — `@view-transition { navigation: auto; }` on both pages (Chrome/Edge 126+, Safari 18+; Firefox in development). Shared `view-transition-name` across pages = morphing element (hero-to-detail continuity). Hooks: `pageswap` (outgoing) / `pagereveal` (incoming, before first render — the entrance-choreography hook). Gate with `@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }`.
- **Next.js App Router:** exit animations are broken by design (`template.tsx` remounts; AnimatePresence needs the old tree alive). `FrozenRouter` hacks have open back/forward bugs. **Safe default: enter-only choreography**; the sanctioned future is React's experimental `<ViewTransition>`.
- **Astro:** `<ClientRouter />` for SPA-style transitions with fallback, or pure native `@view-transition`.
- **Barba.js** (7kB) still alive and used with GSAP; Swup is the lighter alternative.
- **Universal timing:** exit 0.3–0.6s, fetch hidden behind the exit, enter 0.6–1.2s with content stagger, **overlap them**; total ≤~1.2s or repeat navigation becomes painful. One `isTransitioning` guard against double-navigation. Persistent elements (nav, logo) live outside the swap container.

## 10. Session-aware intros

```js
// inline in <head>, before first paint — the no-intro path must never flash intro states
if (!sessionStorage.getItem("introSeen")) {
  document.documentElement.classList.add("play-intro");
  sessionStorage.setItem("introSeen", "1");
}
```
- Default CSS state = the **final** (visible) layout; intro starting states apply only under `.play-intro` — this also protects LCP, no-JS, and reduced-motion.
- `sessionStorage` = replay per visit (the usual high-end choice); `localStorage` with `{v, t}` = once ever, re-triggerable on redesign.
- Interruptible: first scroll/click/keydown jumps the timeline to end (`tl.progress(1)`). Reduced-motion skips the intro entirely.
- Tiering used by high-end studios: full intro (first visit) → short curtain (same-session navigations, via View Transitions/Barba) → instant (reduced-motion/data-saver).

## Distilled rules

1. Pinned scrub with native scroll = fine; wheel hijacking / mandatory snap = condemned. Nav visible, text static while readable, skip on mobile.
2. Budget ~1 viewport of scroll per narrative beat; scenes ≤4 viewports; rest segments at pin edges.
3. The DOM is the accessible article; scroll effects are a presentation layer. Reduced-motion = the unpinned static version, designed day one.
4. Never start the LCP element at `opacity: 0` — use 0.1, animate transforms, or animate after first paint.
5. Preloader only when assets genuinely gate; determinate; curtain-out overlaps hero-in; skippable; session-aware.
6. Exit ≤0.6s, enter ≤1.2s, overlapped; enter-only is the safe Next.js App Router default.

## Sources
NN/g Scrolljacking 101 · The Pudding (scrollytelling how-to, sticky, responsive) · scrollama · GSAP ScrollTrigger docs + official gsap-skills · web.dev LCP · DebugBear opacity/LCP · Shopify LCP fix · Chrome cross-document View Transitions · MDN View Transition API · Codrops (async page transitions, Barba+GSAP, preloading effect, layered zoom, cinematic 3D scroll) · GSAP SplitText · web.dev font best practices · Simon Hearne webfont CLS · ScrollReveal UX guide · Astro view transitions · next.js discussions #42658 · Three.js Journey loading lesson · Prismic hero guide

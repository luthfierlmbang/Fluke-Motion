# Kinetic Typography — Text Motion Beyond Basic Reveals

Reference for the fluke-motion skill. Read this for scramble/decode text, variable font animation, text on paths, 3D text, character physics, liquid text, split-flap boards, and the full text-reveal vocabulary. Basic SplitText line reveals live in advanced-techniques.md — this is the specialist layer.

Foundation: **GSAP is fully free since 3.13** including SplitText (rewritten: 50% smaller, `mask` option, `autoSplit`, `onSplit()`, built-in `aria`), ScrambleText, MorphSVG.

## Two universal gotchas (apply to nearly everything here)

**A. Split-text accessibility.** Split spans make screen readers announce letters one at a time or skip content. Fix:
```html
<h1 aria-label="Kinetic typography">
  <span aria-hidden="true"><!-- split spans --></span>
</h1>
```
GSAP 3.13 `aria: "auto"` does this automatically — BUT it flattens nested semantics (links inside split text vanish); GSAP's own advice for complex content: `aria: "hidden"` + a visually-hidden duplicate copy. Every split effect: reduced-motion renders final static text.

**B. Font loading.** Splitting before webfonts load = wrong line breaks + garbage on reflow:
```js
document.fonts.ready.then(() => SplitText.create("#h", { ... }));
```
GSAP `autoSplit: true` handles it (re-splits on font load + resize) — **create tweens inside `onSplit(self)`** so re-splits re-target fresh elements.

## Table of contents
1. [Scramble/decode](#1-scrambledecode) · 2. [Typewriter](#2-typewriter) · 3. [Variable font animation](#3-variable-font-animation) · 4. [Text on a path](#4-text-on-a-path) · 5. [3D/extruded text](#5-3dextruded-text) · 6. [Character physics](#6-character-physics) · 7. [Text distortion shaders](#7-text-distortion-shaders) · 8. [Marquee type](#8-marquee-type) · 9. [Reveal variations table](#9-reveal-variations) · 10. [Wavy text](#10-wavy-text) · 11. [Highlight, gradient, shimmer](#11-highlight-gradient-shimmer) · 12. [Split-flap board](#12-split-flap-board) · 13. [Outline-to-fill & self-drawing](#13-outline-to-fill--self-drawing) · 14. [Glitch, magnetic letters, hover-per-letter](#14-the-rest)

---

## 1. Scramble/decode

**What:** characters cycle through random glyphs, resolve left-to-right — "hacker decode." **Why:** high novelty at near-zero layout cost; right for dev-tool/AI/web3 heroes, nav hovers, stats. Wrong for long copy (unreadable mid-scramble).

```js
gsap.to("#el", { duration: 1.2, scrambleText: {
  text: "SYSTEMS ONLINE", chars: "upperCase", revealDelay: 0.3, speed: 0.4 } });
```
GSAP ScrambleTextPlugin (free); custom char sets (`"01"`, `"█▓▒░"`); hover-scramble = scramble to the same text. React copy-paste: shadcn.io Scrambled Text, Fancy Components.

**Pitfalls:** **use monospace or same-width glyph pools** — random "W" vs "i" reflows everything (the biggest amateur tell); `aria-label` with final text, churn hidden in `aria-hidden` span; never inside `aria-live`.

## 2. Typewriter

**What:** chars appear sequentially with a blinking caret. **Why:** mimics authorship/conversation — AI products, terminals, storytelling. The caret is the craft: a real element (`width: 1ch; background: currentColor`), **blink pauses while typing** (real cursors don't blink mid-type).

**Stack:** TypeIt (most capable; commercial license) · Typed.js · typewriterjs (MIT) · pure CSS `steps()` (single-line only; breaks on multi-line/proportional fonts).

**Pitfalls:** looping typewriters fail WCAG 2.2.2 (>5s motion needs pause); `aria-hidden` the typing container + sr-only full text (SRs re-announce mutations); reserve final height (`min-height` or invisible sizer) or multi-line typing causes CLS.

## 3. Variable font animation

**What:** letterforms themselves morph — weight swells through a word like a wave, width stretches on scroll, slant follows cursor. **Why:** animates the *design of the glyph*, not its box — uniquely typographic, pure CSS-able, zero layout hacks. Needs a font with real axes (Fraunces, Roboto Flex, Recursive, Inter; browse v-fonts.com).

```css
@keyframes wave { 0%,100% { font-variation-settings: 'wght' 100 } 50% { font-variation-settings: 'wght' 900 } }
.char { animation: wave 1.6s ease-in-out infinite; animation-delay: calc(var(--i) * 60ms); }
```
Scroll-driven: `animation-timeline: view()` or ScrollTrigger scrub. Cursor proximity ("weight follows pointer"): per-char distance → `wght`, via `gsap.quickTo` per char or Fancy Components' variable-font-hover-by-letter.

**Pitfalls:** `font-variation-settings` overwrites ALL axes — repeat every axis in every keyframe (prefer high-level `font-weight` when possible); weight changes reflow — embrace the wave, or use Roboto Flex's `GRAD` axis (apparent weight, no width change — the fix for "bold on hover jumps"); axis animation re-rasterizes glyphs per frame — headline yes, paragraphs no; a11y benign (DOM text intact) unless you split.

## 4. Text on a path

**What:** text rides a curve — spinning circular badges, arcs, wavy baselines. **Mechanism:** SVG `<textPath href="#curve" startOffset="0%">`; animate `startOffset` via JS/GSAP attr or SMIL. **Circular spinning badge shortcut: rotate the whole `<svg>` with CSS** (compositor) instead of animating startOffset (main thread). Letters swarming along an arbitrary curve: GSAP MotionPathPlugin on split chars (`motionPath: { path, align, autoRotate }` + stagger).

**Pitfalls:** text longer than path silently truncates; kerning on tight curves needs `letter-spacing`; decorative spinners get `role="img"` + `aria-label`.

## 5. 3D/extruded text

**Tiers:**
1. **CSS 3D** (cheap, real text): parent `perspective`, per-char `rotateX/rotateY`, fake extrusion via stacked `text-shadow` — best for char-flip reveals and tilting headlines.
2. **troika-three-text** — the Three.js default: parses .woff directly, SDF atlas generated in a web worker, proper kerning/ligatures, works with any material. R3F: drei `<Text>`. Call `.sync()` after changes.
3. **True extrusion:** Three.js `TextGeometry` — real bevels; heavy; logo pieces only.
4. **MSDF pipeline** (three-msdf-text-utils) for shader-driven type; the famous Codrops look — text as repeating texture on rotating geometry (render text to render-target, animate UV offset in shader).

**Pitfalls:** canvas/WebGL text invisible to AT — sr-only DOM mirror always; CSS 3D text blurs mid-transform (snap rotate to 0 at rest); Safari preserve-3d breaks with overflow/filter ancestors.

## 6. Character physics

**What:** letters as rigid bodies — drop, pile, get flung by cursor, dangle. Playful: 404s, footers, experimental portfolios. **This is a destructive effect** — once scattered, text is unreadable: sr-only intact copy + `aria-hidden` physics spans, always a reset affordance, reduced-motion = static text.

**Stack:** Matter.js (the standard): per-char `Bodies.rectangle` + `MouseConstraint`, sync body transforms back to absolutely-positioned spans per tick. matter-attractors plugin for magnetic fields. Lightweight alternative (no engine): spring repulsion per char via `gsap.quickTo` — "letters dodge the cursor." React copy-paste: shadcn.io Falling Text, Fancy Components Cursor Attractor & Gravity.

**Pitfalls:** enable `enableSleeping` (settled pile must stop consuming CPU); pause engine offscreen; use measured glyph boxes not em-boxes or collisions look floaty.

## 7. Text distortion shaders

**What:** text ripples/melts/smears under the cursor. **Two tiers:**
- **SVG feTurbulence + feDisplacementMap** (works on live DOM text, no canvas): animate `baseFrequency`/`seed` for boiling/squiggle. "The middle ground between CSS and WebGL."
- **WebGL:** render text to texture (canvas 2D or MSDF), displace UVs in fragment shader; cursor liquid = pointer-velocity flowmap as displacement; per-channel UV offsets = chromatic aberration; `uv.y += sin(uv.x*10.0+uTime)*uAmp` = wave.

**Pitfalls:** animated SVG filters are CPU-rendered and slow (worst in Firefox/Safari) — small areas, throttled, never on scroll-critical content; distorted text is unreadable mid-effect — treat as decorative, resolve to a legible rest state; DPR-scale the text texture.

## 8. Marquee type

Giant looping word strips, alternating directions per row, velocity-reactive skew — full mechanics in signature-scroll.md §2 (timeScale modulation, `horizontalLoop` helper, WCAG pause rules). Typography-specific extras: alternate outline/fill rows (see §13); `will-change: transform` on one animated track, never per-item tweens; no links inside fast marquees.

## 9. Reveal variations

All build on split + stagger; the differentiation is the per-unit from-state. GSAP `mask: "lines"|"words"|"chars"` auto-wraps units in overflow clips.

| Variant | From-state | Notes |
|---|---|---|
| Clip wipe per line | `clip-path: inset(0 100% 0 0)` | no wrapper needed |
| **Blur-in** (Emil Kowalski signature) | `filter: blur(8px); opacity: 0` + y | blur ≤20px (Safari cost); blur at word/line level, never per char (layer explosion) |
| Unblur/focus-in | same, slower, whole block | "camera focusing"; pair with scale 1.02→1 |
| 3D char flip | `rotateX(-90deg); transform-origin: 50% 100%` | perspective on parent; stagger 0.02–0.04s |
| Char stagger + rotation | `y: "110%", rotate: 6deg` in mask | rotation sells the "print" feel |
| Letter fade + y | `y: 20, opacity: 0`, `stagger: { each: .015, from: "random" }` | `from: "random"` reads as sparkle |
| Scrub reveal | any above + `scrollTrigger: { scrub: true }` | chars resolve as you scroll |
| Text repetition | large duplicated fragments at differing translate rates | Codrops TextRepetitionEffect |
| Kinetic type page transition | oversized moving words swap routes | Codrops KineticTypePageTransition |

```js
document.fonts.ready.then(() => {
  SplitText.create("h1", { type: "words,chars", mask: "chars", autoSplit: true,
    onSplit: self => gsap.from(self.chars,
      { yPercent: 110, rotate: 5, stagger: 0.02, duration: 0.7, ease: "power3.out" }) });
});
```
**Emil Kowalski's rule of thumb: animate the largest unit that still reads as crafted** — char-level for ≤6 words, lines for paragraphs; UI text motion <300ms, hero moments can run longer.

## 10. Wavy text

Per-char `y = sin(phase + i * freq) * amp`. CSS-only: keyframe translateY + `animation-delay: calc(var(--i) * 80ms)`. Interactive ripple through neighbors: GSAP `stagger: { from: i, each: .03, yoyo: true, repeat: 1 }` — **`stagger.from: index` is the trick.** Weight-wave variant: wave the `wght` axis instead of y (no positional motion — reduced-motion-friendlier). Infinite bobbing violates 2.2.2 without pause — prefer hover-triggered; decorative headers only.

## 11. Highlight, gradient, shimmer

- **Scroll highlight ("read as you scroll"):** gradient background grows with scroll — `background-size: 0% 100%` → 100%, `box-decoration-break: clone` for multi-line accuracy. Full pattern in signature-scroll.md §6. **The most a11y-friendly technique in this file** (DOM intact, no split needed).
- **Animated gradient text:** `background-clip: text; color: transparent` + animate `background-position` (size >100% so there's travel room).
- **Shimmer sweep** (the "AI is thinking" text): narrow light band swept via background-position, ~15deg angle. **Semantic warning: infinite shimmer on static labels reads as "loading"** — use for actual pending states; trigger once on viewport entry otherwise.

```css
.shimmer { background: linear-gradient(110deg, #444 40%, #fff 50%, #444 60%);
  background-size: 200% 100%; -webkit-background-clip: text; color: transparent;
  animation: sweep 2.4s linear infinite; }
@keyframes sweep { to { background-position: -200% 0 } }
```
**Pitfall:** `color: transparent` + failed background-clip = invisible text — `@supports` guard + both prefixed and standard properties; mid-sweep contrast must stay ≥4.5:1.

## 12. Split-flap board

**What:** each char is a mechanical flap flipping through the alphabet until it lands, cascading clatter — Solari departure board. Retro-mechanical: schedules, countdowns, travel brands. **Mechanism:** per char, two halves — top `rotateX(0→-90deg)` showing next char, bottom `rotateX(90→0)`; cycle a fixed char drum; stagger columns. Libraries: HotFX `<split-flap>` web component, Vheissu/flipflap.

**Pitfalls:** monospace mandatory; cap cycle length (shortest drum path) or updates take seconds; `backface-visibility: hidden` + halved line-height clipping is where builds break; announce only the final string (`aria-live="polite"` on a hidden mirror), flaps `aria-hidden`; sound off by default.

## 13. Outline-to-fill & self-drawing

- **Outline↔fill:** `-webkit-text-stroke: 1px currentColor; color: transparent` → fill on hover/scroll. Alternating outline/fill marquee rows = classic awwwards footer. Thin fonts get eaten by centered strokes — bolder weight, or SVG `paint-order: stroke`.
- **Fill wipe:** filled duplicate on top clipped by `clip-path: inset(0 100% 0 0)` → 0; scrubbed = "ink fills the word."
- **Self-drawing:** convert text to SVG outlines, dasharray/dashoffset draw (see creative-effects.md §1), then fade `fill` in for the finish. Converted text is not text — `role="img"` + `aria-label`. Handwriting fonts need a hidden single-stroke path traced over the letters (mask technique) since letterforms are closed outlines.

## 14. The rest

- **Glitch (RGB split):** duplicate text into `::before/::after` (`content: attr(data-text)`), tint cyan/magenta, jitter opposite translateX + fast `clip-path: inset()` slices. **Confine to hover/focus** — continuous glitch is a perf + WCAG 2.3.1 hazard (keep flicker <3/sec). Pseudo-element copies are ignored by SRs (good).
- **Letter-roll nav hover:** each letter is a vertical 2-row strip that translates to show the duplicate — same mechanism as odometer digits.
- **Magnetic letters:** element eases toward cursor in a radius, spring-returns. **The classic flicker bug: apply the transform to an inner span, keep the outer hitbox static** — a magnetic offset must never move the hit target out from under the cursor.
- **Hover-per-letter:** one `pointermove` listener on the container + per-char distance math (never 50 individual listeners); decay to neighbors like §10.
- **Number tickers:** NumberFlow is best-in-class (see interaction-recipes.md §8); Motion `AnimateNumber` is the Motion-native option.

## Decision heuristics

- **DOM/CSS-only** (gradient, shimmer, outline-fill, marquee, variable font, wavy CSS): text stays selectable/SEO-visible; cheapest, most accessible. Default here.
- **Split + GSAP** (reveals, scramble, per-letter hover): per-unit orchestration; pay the §A accessibility contract every time.
- **SVG** (textPath, feTurbulence, stroke draw): effect is about the *path or outline*; watch Safari.
- **WebGL** (troika/MSDF, distortion): per-pixel or 3D; costs bundle + battery + a11y mirror — one hero moment per page.
- **Physics** (Matter.js): destructive/playful — 404s, footers, easter eggs; never body copy.
- Every loop: pause affordance or viewport-gating; every split: `fonts.ready`/`autoSplit` first, aria always.

## Sources
GSAP docs (SplitText, ScrambleText, seamlessLoop) + GSAP issue #642 · Adrian Roselli "Just Don't Split Words into Letters" · CSS-IRL accessible split text · Codrops (kinetic Three.js typo, on-scroll typography sets 1–2, text repetition, SVG kinetic letters, WebGPU MSDF dissolve, feTurbulence) · troika-three-text · 24 Ways / Mandy Michael (variable fonts) · Dinamo variable fonts guide · Fancy Components · Olivier Larose (Matter.js letters) · TypeIt/typewriterjs · CSS-Tricks (typewriter, curved text, SVG line animation, number counters) · Emil Kowalski / animations.dev · Osmo · shadcn.io text effects · HotFX split-flap · NumberFlow · Awwwards typography collections · v-fonts.com

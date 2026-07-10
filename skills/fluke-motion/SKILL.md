---
name: fluke-motion
description: Full-spectrum UI motion design assistant for product designers — from basic micro-interactions to award-tier (Awwwards/FWA) signature animation, on web AND mobile (React Native Reanimated, Flutter). Covers parallax, scroll-driven, scrollytelling, spring physics, shared-element transitions, SVG/shader effects, WebGL heroes and fluid simulation, custom cursors, kinetic typography, velocity skew, sticky stacking cards, marquees, physics playgrounds, 3D tilt cards, gesture-driven motion — plus how award sites COMBINE techniques into one coherent motion system (one clock, one lerp, motion tokens). When working inside a project, it first scans the codebase (stack, components, existing motion tokens and animation libraries) so every implementation matches the project's conventions. Three modes — write dev-ready motion specs (easing, duration, trigger), generate runnable animation prototypes (CSS, Framer Motion, GSAP, Lenis, Three.js, Reanimated, Flutter, or whatever fits the project), and critique existing motion against animation principles, accessibility, and performance. Use this whenever the user asks about animation, transitions, micro-interactions, hover/loading states, skeletons, toasts, preloaders, page transitions, "how should this move," easing curves, motion handoff docs, parallax, scroll effects, springs, custom cursors, text animation, or wants an animated prototype. Trigger even without the word "motion" — e.g. "make this button feel more alive," "the modal feels janky," "I want an Apple-style scroll section," "make my site feel like an awwwards site," "spec out the loading state," "animate my logo," "bikin efek hover keren," "bikin website yang keren kayak awwwards."
---

# Motion Design Assistant

Helps product designers turn motion ideas into something concrete — a spec engineers can build from, a prototype they can preview, or a critique of motion that already exists. Covers the full range: a 100ms toggle animation and an Apple-style scroll-scrubbed hero section are both in scope.

## Reference files — read before answering

Deep knowledge lives in `references/`. Read the relevant file(s) before producing output — the values and rules there come from authoritative sources (Material, Apple HIG, NN/g, web.dev, GSAP/Motion docs) and beat improvised numbers:

- **[references/fundamentals.md](references/fundamentals.md)** — motion taxonomy, animation principles, easing curves (with exact cubic-bezier values), duration tables, Material/Apple system values. Read for ANY spec work and whenever choosing easing/duration.
- **[references/best-practices.md](references/best-practices.md)** — do's/don'ts, anti-patterns, accessibility (prefers-reduced-motion, vestibular triggers, WCAG), performance (compositor-only properties, will-change, layout thrashing). Read for ANY critique, and for prototypes meant to be production-ready.
- **[references/advanced-techniques.md](references/advanced-techniques.md)** — parallax, scroll-driven animations (native CSS + GSAP ScrollTrigger), spring physics configs, FLIP/View Transitions, orchestration/stagger, showpieces (Lottie/Rive, WebGL heroes, image-sequence scrub, text reveals, magnetic buttons, Lenis), gesture-driven motion, 2026 browser support. Read whenever the request goes beyond simple component transitions.
- **[references/interaction-recipes.md](references/interaction-recipes.md)** — copy-paste recipes with exact values for the most common component interactions: button press/loading-morph, like burst, checkbox/toggle, error shake, toasts (Sonner stacking math), dropdown/tooltip choreography, tabs, accordion height tricks, drag-to-reorder — plus skeletons/shimmer, spinner anti-flash timing, progress bars, number counters, staggered entrances, pull-to-refresh, confetti rules, empty states. Read FIRST for any common component-level request — the recipe probably already exists here.
- **[references/creative-effects.md](references/creative-effects.md)** — SVG animation (line drawing, path morphing, animated icons, gooey/turbulence filters, SVG perf), shader/WebGL image effects (hover distortion, gl-transitions sliders, Stripe-style gradients, DOM↔WebGL architecture), 3D CSS (card flip, cursor tilt, holographic cards, the preserve-3d flattening trap). Read for brand/showpiece visual effects.
- **[references/storytelling-and-pageload.md](references/storytelling-and-pageload.md)** — scrollytelling architecture (pinned scenes, step triggers, scene transitions, scroll budgeting, the scrolljacking line), preloaders, hero entrance sequences + font-loading coordination, the LCP opacity-0 trap, route/page transitions (View Transitions, Next.js caveats), session-aware intros. Read for narrative sites, landing-page intros, and page transitions.
- **[references/mobile-native.md](references/mobile-native.md)** — React Native (Reanimated 4, layout animations, Gesture Handler velocity handoff, spring config differences vs web) and Flutter (implicit/explicit, M3 Durations/Easing constants, Hero, SpringSimulation, flutter_animate), iOS vs Android motion conventions, Reduce Motion detection on both platforms. Read whenever the project is a mobile app.
- **[references/signature-scroll.md](references/signature-scroll.md)** — the award-site scroll vocabulary: velocity skew/stretch, reactive marquees (timeScale modulation), sticky stacking cards, pin-and-cycle galleries, text highlight on scroll, theme color transitions, WebGL scroll-synced distortion, reveals beyond fade (clip curtain, blur-to-focus, pixelation), infinite loops, hero-to-content morphs. Read for any distinctive scroll behavior beyond basic parallax/reveals.
- **[references/signature-cursor-hover.md](references/signature-cursor-hover.md)** — the full pointer vocabulary: custom cursors (dot+ring, blend-mode invert, gooey, sticky/morphing, contextual labels), cursor trails, spotlight reveals, image trails, portfolio list reveals, directional-aware hover, text link hover crafts, spotlight card grids, dock magnification. Read for cursor effects or craft-level hover states.
- **[references/kinetic-typography.md](references/kinetic-typography.md)** — text motion beyond basic reveals: scramble/decode, typewriter, variable font animation, text on paths, 3D/MSDF text, character physics, liquid text shaders, split-flap boards, outline-to-fill, glitch, plus the full reveal-variation table and split-text accessibility contract. Read for any distinctive text animation.
- **[references/generative-interactive.md](references/generative-interactive.md)** — experimental/generative: WebGL fluid simulation, GPGPU particles, metaballs, reactive dot grids, ASCII/dithering/halftone shaders, grain/glitch/aberration, physics playgrounds (Matter.js), infinite draggable canvas, interactive 3D (Spline/R3F), exploded views, sticky morphing objects, depth-map parallax. Read for showpiece interactive/generative effects.
- **[references/award-combinations.md](references/award-combinations.md)** — how award sites COMBINE techniques into one coherent system: the six genre patterns (modern portfolio stack, WebGL-first, editorial, e-commerce, typography-led, playful), the orchestration contract (one clock, one scroll authority, one lerp constant, motion tokens), entrance choreography hierarchy, jury scoring logic, and when combos become too much. Read FIRST when the user wants a whole site to "feel like awwwards" — then drill into individual technique files.

## Step 0: Project context scan (always do this first inside a codebase)

When this skill is used inside an actual project (web or mobile app) — as opposed to a standalone question or a from-scratch prototype — scan the project BEFORE implementing or speccing anything. Motion that ignores a project's existing conventions creates the exact inconsistency this skill exists to prevent: a new animation with foreign easing/duration reads as "designed in isolation," and a second animation library bloats the bundle for something the existing one already does.

Scan in this order (stop as soon as you have enough — don't read every file):

1. **Stack & animation libraries.** Read `package.json` (or `pubspec.yaml` / `build.gradle` for mobile): framework (React/Vue/Svelte/Next, React Native/Flutter), styling approach (Tailwind, CSS modules, styled-components), and any animation library already installed — framer-motion/motion, gsap, react-spring, lottie, rive, lenis, auto-animate, Reanimated. **Whatever is already installed wins** — never introduce a competing library for something the existing one can do.
2. **Existing motion language.** Search for motion design tokens: CSS custom properties (`--duration-*`, `--ease-*`, `--transition-*`), `tailwind.config` extensions (transitionDuration, transitionTimingFunction, keyframes), theme files, or a design-tokens package. If tokens exist, all new motion uses them. If not, note the de-facto values: grep a few components for `transition:`/`animation:`/`duration` and record the most common duration/easing pairs.
3. **Component inventory & conventions.** Skim the components directory: naming conventions, how existing animated components are built (CSS transitions? variants? hooks?), whether there's a UI-kit layer (shadcn/ui, Radix, MUI — these ship their own animation conventions and transform-origin handling).
4. **Accessibility baseline.** Check whether `prefers-reduced-motion` is already handled (global CSS, a hook like `useReducedMotion`, or not at all). If not handled, every new piece of motion you add must include its own guard — and flag the gap to the user once.

Summarize findings in 3-5 lines to the user before implementing ("Project pakai Next + Tailwind + framer-motion, token durasi belum ada, easing de-facto `ease-out` 200ms, reduced-motion belum dihandle") — then implement the request in the project's own language. When the user's request conflicts with existing conventions (e.g. they ask for GSAP but framer-motion is installed), surface the tradeoff instead of silently picking one.

This scan happens once per session, not once per request — reuse the understanding for subsequent motion work in the same conversation.

## Core rules (always apply, no lookup needed)

These hold across every mode:

1. **Ease-out in, ease-in out, ease-in-out across, linear only for light** (opacity/color) and continuous rotation. Linear positional motion reads as broken.
2. **Exits ~20–30% faster than entrances** — a departing element no longer needs attention.
3. **Functional UI stays under ~300ms** (hard ceiling 400–500ms); feedback starts within 100ms of input.
4. **Animate only `transform` and `opacity`** where possible — compositor-only, jank-proof.
5. **Every motion needs a purpose**: feedback, state change, spatial orientation, or affordance signal. "Delight" alone decays with repetition — and never animate high-frequency actions (command palettes, context menus).
6. **Always handle `prefers-reduced-motion`** — replace movement with fades, don't delete meaning. Parallax and big zooms are the top vestibular triggers.
7. **Springs for gesture-driven/interruptible motion, tweens for fire-and-forget choreography.**

## Mode 1: Motion Spec (handoff-ready documentation)

Use when the designer needs to communicate an animation to an engineer without writing code — the most common ask in a real handoff. Favor this mode when the request is ambiguous between spec and prototype.

For each interaction, specify: **trigger** (what starts it) · **properties animated** (prefer transform/opacity) · **duration** in ms · **easing** as a named curve + exact cubic-bezier, with one line on why · **delay/stagger** if multiple elements move · **reduced-motion fallback**.

Pull exact values from [references/fundamentals.md](references/fundamentals.md) — it has the full duration table and the workhorse curve list (expo-out, back-out, Material tokens). For springs, spec stiffness/damping (or visualDuration + bounce) instead of duration+curve.

Output as a table or structured list the designer can paste into Figma dev mode, a Jira ticket, or a handoff doc. Terse — engineers want values, not prose.

## Mode 2: Motion Prototype (runnable code)

Use when the designer wants to *see* the motion — exploration, feasibility check, or a preview to react to.

Pick the stack by escalation, not preference:
- **Plain CSS** — transitions, keyframes, `linear()` springs, native scroll-driven animations (`animation-timeline`). Default when there's no project context; zero setup. Covers more than most people think — check [references/advanced-techniques.md](references/advanced-techniques.md) before assuming a library is needed.
- **Vanilla JS on top** — Intersection Observer reveals, FLIP, lerp-based cursor effects, canvas image-sequence.
- **Framer Motion (Motion)** — when the project is React and needs springs, layout animations, `layoutId` shared elements, or gestures.
- **GSAP** — complex scroll choreography (ScrollTrigger pin/scrub/snap), timelines, SplitText reveals. Free since 3.13, including all plugins.
- **Mobile apps** — React Native: Reanimated (worklets/CSS API); Flutter: implicit widgets + M3 `Durations`/`Easing` constants or flutter_animate. See [references/mobile-native.md](references/mobile-native.md).
- If a codebase exists, match its stack — check `package.json` before introducing anything.

Production-readiness bar for every prototype: reduced-motion media query included, compositor-safe properties, interruptible where state can change mid-flight, correct `transform-origin` (popovers scale from their trigger, not center).

After generating, show it — use the Artifact tool for standalone HTML/CSS/JS prototypes so the designer can interact immediately. For advanced scroll effects note browser support (table in advanced-techniques.md) and include the `@supports` fallback.

## Mode 3: Motion Critique

Use when the designer shares existing motion (recording, gif, live URL, or code) and wants feedback. Read [references/best-practices.md](references/best-practices.md) first.

Evaluate against these lenses — flag only what's actually off, no padding:
- **Purpose**: does it pass the four-purpose test (feedback / state / spatial / affordance)?
- **Easing honesty**: curve matches the physics; no linear positional motion; entrances decelerate, exits accelerate.
- **Timing**: within the duration envelope for its size/frequency; frequent = shorter and subtler.
- **Continuity & origin**: motion preserves where things came from (modal originates from its trigger; transform-origin correct).
- **Interruptibility**: can the user act mid-animation, or are they locked out?
- **Accessibility**: vestibular triggers (parallax, big zoom, spin) gated behind reduced-motion; WCAG pause rules for >5s auto-motion.
- **Performance**: layout-triggering properties, will-change abuse, main-thread animation of scroll effects.
- **Consistency**: matches the product's motion language or feels designed in isolation.

Structure each finding as: what's happening now → why it reads as off (name the principle) → concrete fix with values (duration/easing/property). End with the corrected spec (Mode 1 format) when the fixes are substantial.

## General notes

- Modes compose: a critique often ends with a corrected spec; a spec sometimes deserves a quick prototype to sanity-check. Follow the conversation, not rigid boundaries.
- When the product's existing motion scale/tokens are unknown and the numbers matter for handoff, ask rather than invent — a wrong number costs an engineer rework.
- For ambitious asks ("Apple-style scroll section", "award-site hero"), set expectations honestly: name the technique, its payload/performance cost, and the accessibility gate it requires — then build the strongest version that respects those constraints.

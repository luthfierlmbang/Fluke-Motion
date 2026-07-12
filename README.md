# Fluke Motion 🐋

**Give your AI coding agent the motion design taste of an Awwwards studio.**

Ask any AI agent to "add some animations" and you already know what you'll get: a linear fade here, a random 500ms transition there, an easing curve that feels like a robot doing tai chi, and — every single time — zero thought for the person who gets motion sickness from parallax. It's not that the models can't animate. It's that nobody ever taught them the *craft*: the difference between 200ms and 300ms, why entrances decelerate and exits accelerate, when a spring beats a bezier, and why the best sites on the web feel like they're made of one continuous material instead of a pile of separate effects.

Fluke Motion is that missing education. It's a knowledge skill — a structured library of everything an agent needs to design motion the way a senior interaction designer would — that plugs straight into Claude Code, Cursor, GitHub Copilot, and Windsurf.

## Where it comes from

This isn't a list of copy-pasted snippets someone found on CodePen. Every technique inside was researched from primary sources — Google's Material Design motion specs, Apple's Human Interface Guidelines, Nielsen Norman Group's usability studies, the GSAP and Motion documentation, the web.dev performance guides — and then cross-referenced against real teardowns of the sites winning Awwwards Site of the Day, Site of the Month, and Site of the Year. Studios like Lusion, Obys, Active Theory, and darkroom.engineering don't publish a rulebook, so we reverse-engineered the patterns from their case studies and shipped code.

The result is **150+ techniques**, and each one is documented the same disciplined way: *what the effect actually looks and feels like, why it works and when you should reach for it, the exact tech stack (with alternatives per framework), a code pattern to start from, and the performance and accessibility pitfalls that separate a polished implementation from a janky one.* No vibes. Real numbers, real curves, real tradeoffs.

## Install

```bash
npx fluke-motion install
```

That installs it into **Claude Code** globally by default, so it's available in every project you touch. One command covers every agent:

```bash
npx fluke-motion install --target claude --project   # this project only
npx fluke-motion install --target cursor             # Cursor
npx fluke-motion install --target copilot            # GitHub Copilot
npx fluke-motion install --target windsurf           # Windsurf
npx fluke-motion install --target agents             # AGENTS.md (works with many agents)
npx fluke-motion install --target all                # everything at once
```

Once it's in, you don't have to think about it. Just talk to your agent the way you already do — *"make this button feel more alive," "the modal open/close feels janky, fix it," "I want an Apple-style scroll section," "spec out the loading state," "make my site feel like an awwwards site"* — and the right knowledge is already in context.

## What it knows

The coverage runs the full spectrum, from the smallest micro-interaction to the kind of generative showpiece that makes people screenshot your site:

- **Fundamentals** — the theory that governs everything else: easing curves with their exact cubic-bezier values, duration tables by animation type, the animation principles adapted for UI, and the Material and Apple system tokens.
- **Best practices** — accessibility done properly (`prefers-reduced-motion`, vestibular-disorder safety, the relevant WCAG criteria) and performance done properly (compositor-only properties, the 60fps frame budget, avoiding layout thrash).
- **Component recipes** — buttons, toasts, skeletons, accordions, tabs, spinners, progress bars, empty states — the everyday interactions, documented with exact values so your agent stops guessing.
- **Advanced techniques** — parallax, scroll-driven animation, spring physics, FLIP, the View Transitions API, and orchestration/stagger.
- **Award-site signatures** — the "how did they *do* that" layer: velocity skew, sticky stacking cards, scroll-reactive marquees, custom cursors, image trails, kinetic typography, WebGL fluid simulation, GPGPU particle systems, ASCII and dither shaders, physics playgrounds, and infinite draggable canvases.
- **The secret sauce** — the part nobody talks about: how award studios *combine* techniques into one coherent motion system, tuned to a single clock, a single interpolation constant, and a shared set of motion tokens, so an entire site reads as one material instead of a scrapbook of effects.
- **Mobile, not just web** — React Native (Reanimated) and Flutter, including where iOS and Android motion conventions genuinely differ and how to spec each.

## See it move — before you install anything

Don't take a README's word for how motion should feel. Open a browser, double-click a file, watch it work — no build step, no server, no dependencies:

- **[`showcase/motion-showcase.html`](skills/fluke-motion/showcase/motion-showcase.html) — start here.** "Motion in Context": ~25 sections, each one a real component — a pricing block, a feature selector, a testimonial slider where the cursor itself becomes the control, an editorial story that pins and reveals as you scroll, a sign-up form with honest loading states, tilt cards, kinetic type, parallax, a generative background — every section explains *what's* moving and *why* before it shows you. One shared clock, one interpolation constant, a reduced-motion toggle that actually works. This is the fastest way to feel what "one coherent motion system" means instead of reading about it.
- **[`showcase/motion-specimen.html`](skills/fluke-motion/showcase/motion-specimen.html)** — the full catalog, wall to wall: 100+ techniques cataloged end to end, the majority built live so you can play with the exact effect before asking your agent to build it.
- **[`showcase/dc-teardown.html`](skills/fluke-motion/showcase/dc-teardown.html)** — a real Awwwards-adjacent site, reverse-engineered and rebuilt in vanilla JS, labeled move by move. Proof this isn't theoretical — it's what shipping sites actually do.

If a picture is worth a thousand words, a live cubic-bezier is worth the whole spec sheet.

## It respects your codebase

Point it at an existing project and it does the thing a careful designer would do first: it looks around. It reads your stack, checks which animation library you're already using, and finds your existing motion tokens — then it implements new work in *your* conventions instead of dragging in a second animation library or inventing durations that clash with everything else on the page. New motion that matches the old motion is the whole point.

## Under the hood

```
skills/fluke-motion/
├── SKILL.md                            # routing, core rules, 3 working modes
├── showcase/                           # open these in a browser, see "See it move" above
│   ├── motion-showcase.html            # every technique, in a real component
│   ├── motion-specimen.html            # the full catalog, live
│   └── dc-teardown.html                # a real site, reverse-engineered
└── references/
    ├── fundamentals.md                 # taxonomy, principles, easing, duration tables
    ├── best-practices.md               # accessibility, performance, do/don't
    ├── advanced-techniques.md          # parallax, scroll-driven, springs, FLIP
    ├── interaction-recipes.md          # component recipes + loading choreography
    ├── creative-effects.md             # SVG, shader/WebGL, 3D CSS/tilt
    ├── storytelling-and-pageload.md    # scrollytelling, preloaders, page transitions
    ├── signature-scroll.md             # velocity skew, stacking cards, marquees, WebGL scroll
    ├── signature-cursor-hover.md       # custom cursors, trails, spotlight, image trails
    ├── kinetic-typography.md           # scramble, variable fonts, char physics, liquid text
    ├── generative-interactive.md       # fluid sim, particles, ASCII/dither, physics, canvas
    ├── award-combinations.md           # how award sites combine it all into one system
    └── mobile-native.md                # React Native (Reanimated) & Flutter
```

Everything is organized so your agent only loads the reference it needs for the task in front of it — a question about a loading spinner doesn't drag in the WebGL fluid docs — which keeps it fast and focused no matter how deep the library gets.

## Three ways to work

However you like to work, the skill meets you there:

- **Spec** — dev-ready handoff docs (trigger, properties, duration, easing, reduced-motion fallback) you can paste straight into Figma, Jira, or a ticket.
- **Prototype** — runnable code in whatever stack fits the project, so you can *see* the motion instead of imagining it.
- **Critique** — point it at existing motion (a recording, a URL, or the code) and get it reviewed against animation principles, accessibility, and performance, with concrete fixes.

## The bar

Every site that's ever won Site of the Day did the same three things: one clock, one feel, and restraint everywhere the spotlight isn't. That's not a secret — it's just rarely written down anywhere an AI agent can read it before it starts typing code. Now it is. Install it once, and every "make this feel more alive" gets answered like a motion designer said it, not like a linear-fade default.

## License

MIT

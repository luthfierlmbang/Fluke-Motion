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

## It respects your codebase

Point it at an existing project and it does the thing a careful designer would do first: it looks around. It reads your stack, checks which animation library you're already using, and finds your existing motion tokens — then it implements new work in *your* conventions instead of dragging in a second animation library or inventing durations that clash with everything else on the page. New motion that matches the old motion is the whole point.

## Under the hood

```
skills/fluke-motion/
├── SKILL.md                            # routing, core rules, 3 working modes
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

## License

MIT

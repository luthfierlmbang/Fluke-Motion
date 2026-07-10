# Fluke Motion 🐋

**Give your AI coding agent the motion design taste of an Awwwards studio.**

Most AI agents animate like it's 2015 — linear easing, random durations, no accessibility. Fluke Motion is a knowledge skill that teaches Claude Code, Cursor, Copilot, and Windsurf how motion *actually* works: the exact easing curves, the millisecond timings, the physics, and the award-winning techniques behind the web's best sites.

**150+ techniques** distilled from Material Design, Apple HIG, Nielsen Norman Group, GSAP, and teardown after teardown of Awwwards SOTD/SOTY sites — each one documented with *what it is, why it works, when to use it, the tech stack, and the code pattern.*

## Install

```bash
npx fluke-motion install
```

Installs into **Claude Code** globally by default. One command, any agent:

```bash
npx fluke-motion install --target claude --project   # this project only
npx fluke-motion install --target cursor             # Cursor
npx fluke-motion install --target copilot            # GitHub Copilot
npx fluke-motion install --target windsurf           # Windsurf
npx fluke-motion install --target agents             # AGENTS.md (works with many agents)
npx fluke-motion install --target all                # everything at once
```

Then just ask — *"make this button feel more alive," "I want an Apple-style scroll section," "make my site feel like an awwwards site."*

## What it knows

From a 100ms button press to fluid simulations that follow your cursor:

- **Fundamentals** — easing curves (with exact cubic-beziers), duration tables, animation principles, Material/Apple system values
- **Best practices** — accessibility (`prefers-reduced-motion`, vestibular safety, WCAG), performance (compositor-only properties, 60fps budget)
- **Component recipes** — buttons, toasts, skeletons, accordions, tabs, loading states — copy-paste with exact values
- **Advanced** — parallax, scroll-driven animation, spring physics, FLIP, View Transitions, orchestration
- **Award-site signatures** — velocity skew, sticky stacking cards, reactive marquees, custom cursors, image trails, kinetic typography, WebGL fluid simulation, GPGPU particles, ASCII/dither shaders, physics playgrounds, infinite draggable canvases
- **The secret sauce** — how award studios *combine* techniques into one coherent system (one clock, one lerp, motion tokens) so a whole site feels like a single material
- **Mobile too** — React Native (Reanimated) & Flutter, with iOS vs Android conventions

## Works with your project

Drop it into an existing codebase and it scans first — your stack, your animation library, your existing motion tokens — then implements in *your* conventions instead of bolting on something foreign.

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

Three modes: **spec** (dev-ready handoff docs), **prototype** (runnable code in whatever stack fits), and **critique** (review existing motion against principles, accessibility, and performance).

## License

MIT

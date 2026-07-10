# Fluke Motion 🐋

Full-spectrum UI motion design skill for AI coding agents — from a 100ms button press to award-tier (Awwwards/FWA) signature animation and React Native/Flutter motion. One source of truth, installable into whichever agent you use.

Covers: motion fundamentals (easing, duration, principles) · accessibility & performance · parallax, scroll-driven animation, spring physics, FLIP/View Transitions · component recipes (buttons, toasts, skeletons, accordions) · SVG/shader/3D showpiece effects · scrollytelling & page-load orchestration · **award-site signatures**: velocity skew, sticky stacking cards, reactive marquees, custom cursors, image trails, kinetic typography, WebGL fluid simulation, GPGPU particles, ASCII/dither shaders, physics playgrounds, infinite draggable canvases · **how award sites combine techniques** into one coherent motion system (one clock, one lerp, motion tokens) · React Native (Reanimated) & Flutter.

## Install

```bash
npx fluke-motion install
```

That installs into **Claude Code**, globally (`~/.claude/skills/`), by default. Other options:

```bash
npx fluke-motion install --target claude --project   # this project only, not global
npx fluke-motion install --target cursor             # Cursor rules (.cursor/rules/)
npx fluke-motion install --target copilot             # GitHub Copilot custom instructions
npx fluke-motion install --target windsurf            # Windsurf rules
npx fluke-motion install --target agents              # AGENTS.md (generic, works with many agents)
npx fluke-motion install --target all                 # install for everything at once
```

Use `--dir <path>` to target a project other than the current directory.

## Why multiple targets?

Claude Code reads a `SKILL.md` + `references/*.md` folder with **progressive disclosure** — it only loads reference files when a request actually needs them, which keeps context usage low. That format is Claude-specific.

Other agents (Cursor, Copilot, Windsurf) don't read that format natively, so for those targets Fluke Motion flattens the same source content into one file in whatever convention that agent expects. You lose progressive disclosure (the agent sees the whole reference at once) but the underlying knowledge — durations, easing curves, accessibility rules, code patterns — is identical everywhere. The `skills/fluke-motion/` folder is the single source of truth; every target is generated from it at install time, so there's nothing to keep in sync by hand.

## What's inside

```
skills/fluke-motion/
├── SKILL.md                            # routing, core rules, 3 working modes
└── references/
    ├── fundamentals.md                 # taxonomy, principles, easing, duration tables
    ├── best-practices.md               # do/don't, accessibility, performance
    ├── advanced-techniques.md          # parallax, scroll-driven, springs, FLIP, GSAP/Motion
    ├── interaction-recipes.md          # component recipes + loading choreography
    ├── creative-effects.md             # SVG, shader/WebGL, 3D CSS/tilt
    ├── storytelling-and-pageload.md    # scrollytelling, preloaders, page transitions
    ├── signature-scroll.md             # velocity skew, stacking cards, marquees, WebGL scroll distortion
    ├── signature-cursor-hover.md       # custom cursors, trails, spotlight, image trails, hover crafts
    ├── kinetic-typography.md           # scramble, variable fonts, char physics, split-flap, liquid text
    ├── generative-interactive.md       # fluid sim, particles, ASCII/dither, physics, infinite canvas
    ├── award-combinations.md           # how award sites combine techniques into one system
    └── mobile-native.md                # React Native (Reanimated) & Flutter
```

## License

MIT

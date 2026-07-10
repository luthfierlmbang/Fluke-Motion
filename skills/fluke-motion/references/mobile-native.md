# Mobile-Native Motion — React Native (Reanimated) & Flutter

Reference for the fluke-motion skill. Read this when the project is a mobile app (React Native or Flutter) or when speccing motion that must follow iOS/Android platform conventions. The fundamentals still apply — duration envelope, exits faster than entrances, purpose test, reduced-motion — this file maps them onto native APIs.

## Table of contents
1. [React Native — Reanimated](#1-react-native--reanimated)
2. [React Native — gestures & ecosystem](#2-react-native--gestures--ecosystem)
3. [Flutter](#3-flutter)
4. [iOS vs Android conventions](#4-ios-vs-android-conventions)
5. [Reduce Motion on mobile](#5-reduce-motion-on-mobile)

---

## 1. React Native — Reanimated

**Status 2026:** Reanimated 4 is stable and the de facto standard; requires RN ≥0.76 with New Architecture (Fabric). Reanimated 3 is maintenance-only for legacy apps. `react-native-worklets` is a required peer install. The built-in `Animated` API is legacy-tier — fine for simple one-off opacity/transform with `useNativeDriver: true` (which only supports opacity + transform), but Reanimated is the answer for anything gesture-driven or layout-affecting.

**The golden rule: animation runs on the UI thread.** Worklets (auto-workletized `useAnimatedStyle`, gesture callbacks) execute on the UI thread, so animation survives a blocked JS thread. Never drive frames from `setState`/`setInterval`.

### Core API
```js
const sv = useSharedValue(0);
const style = useAnimatedStyle(() => ({ transform: [{ translateX: sv.value }] }));

sv.value = withTiming(100, { duration: 300 });   // default 300ms, Easing.inOut(Easing.quad)
sv.value = withSpring(100, { duration: 300, dampingRatio: 1 });  // perceptual duration mode
sv.value = withDecay({ velocity: e.velocityX, clamp: [0, width], rubberBandEffect: true });
sv.value = withSequence(withTiming(50), withSpring(0));
sv.value = withRepeat(withTiming(1), -1, true);
```

**Spring config — do NOT copy Framer Motion numbers.** Defaults differ wildly (Reanimated: stiffness 900/damping 120/mass 4 vs Motion: 100/10/1) — identical values feel completely different. Translate via the perceptual mode both support: "snappy, no bounce, ~300ms" → Reanimated `{ duration: 300, dampingRatio: 1 }` ≈ Motion `{ visualDuration: 0.3, bounce: 0 }`.

### Reanimated 4 CSS-style API
Declarative `animationName`/`transitionProperty` as plain style props — Software Mansion's guidance: **CSS API for the ~80% of state-driven animation, worklets for the ~20% needing frame-level/gesture control.**
```jsx
<Animated.View style={{
  transitionProperty: 'width', transitionDuration: 300,
}} />
```

### Layout animations (entering/exiting/layout)
```jsx
<Animated.View
  entering={FadeInDown.springify().damping(15)}
  exiting={FadeOut.duration(200)}
  layout={LinearTransition}   // animates position when siblings change — FLIP equivalent
/>
```
Preset families: Fade/Slide/Zoom/Bounce/Flip/LightSpeed/Roll/Rotate/Stretch/Pinwheel, all with directional variants and chainable modifiers (`.duration()`, `.delay()`, `.springify()`, `.withCallback()`, `.reduceMotion()`). `LinearTransition` (300ms default) replaces the legacy `LayoutAnimation` API. Keyframe API available for multi-step entrances.

Apply fundamentals: entrances FadeInDown/SlideIn with decelerate feel, exits `.duration()` ~20-30% shorter, stagger list items via `.delay(index * 25)`.

### Shared element transitions — RN's weak spot
`sharedTransitionTag` is still **experimental** (Fabric support behind a feature flag, native-stack only, no web). Spec shared-element moments as nice-to-have with a fade-through/slide fallback, or fake the signature ones with overlay + absolute positioning + Reanimated. Flutter's Hero is far ahead here.

### Moti
Framer Motion-like API on Reanimated 3. Low maintenance velocity, no Reanimated 4 release — fine on existing codebases, but for new projects prefer Reanimated's own CSS API.

### Skia (@shopify/react-native-skia)
Canvas-level drawing; shared values pass directly into Skia props (no re-renders, UI thread). Use for gradients, paths, shaders, particles, charts — not for ordinary UI motion.

## 2. React Native — gestures & ecosystem

Gesture Handler v2 `Gesture` API; callbacks are auto-workletized:
```js
const pan = Gesture.Pan()
  .onChange((e) => { offset.value += e.changeX; })   // changeX = per-frame delta (use for accumulating drags, NOT translationX)
  .onFinalize((e) => {
    offset.value = withDecay({ velocity: e.velocityX, rubberBandEffect: true, clamp: [0, width] });
    // or: withSpring(target, { velocity: e.velocityX })
  });
```
- **Always pass `velocityX/Y` into the release spring/decay** — otherwise motion visibly "dies" at finger-up. This is the velocity-handoff rule from fundamentals, in API form.
- Composition: `Gesture.Simultaneous(pan, pinch)`, `Gesture.Race()`, `Gesture.Exclusive()`.
- Don't call `runOnJS` per frame; derive on the UI thread.
- 120Hz displays: use time/physics-based animation, never per-frame increments.

## 3. Flutter

### Decision tree
Continuous reaction to interaction or infinite repeat → **explicit** (`AnimationController`). Simple A→B on state change → **implicit** (`AnimatedContainer`, `AnimatedOpacity`, `AnimatedSwitcher`, etc. — all take `duration` + `curve`). Custom value implicit → `TweenAnimationBuilder`. Custom explicit → `AnimatedBuilder` + controller.

### Material 3 tokens are first-class constants (Flutter 3.16+)
```dart
AnimatedContainer(
  duration: Durations.medium2,           // 300ms — full M3 scale: short1-4 (50-200), medium1-4 (250-400), long1-4 (450-600), extralong1-4 (700-1000)
  curve: Easing.emphasizedDecelerate,    // Cubic(0.05, 0.7, 0.1, 1.0)
)
```
`Easing.emphasizedDecelerate` (entrances) · `Easing.emphasizedAccelerate` `(0.3, 0, 0.8, 0.15)` (exits) · `Easing.standard` `(0.2, 0, 0, 1)` · `Easing.legacy` = M2 `(0.4, 0, 0.2, 1)`. M3 pairing rule to spec directly: **enter = emphasizedDecelerate @ 450–500ms; exit = emphasizedAccelerate @ 200–250ms.**

The `animations` package (Google) ships M3 patterns as widgets: `OpenContainer` (container transform), `SharedAxisTransition`, `FadeThroughTransition`.

### Curve → CSS mapping (for cross-platform specs)
`Curves.easeOutCubic` = `cubic-bezier(0.215, 0.61, 0.355, 1)` · `Curves.easeOutExpo` = `(0.19, 1, 0.22, 1)` · `Curves.easeOutBack` = `(0.175, 0.885, 0.32, 1.275)` (overshoot) · `Curves.fastOutSlowIn` = M2 standard `(0.4, 0, 0.2, 1)` · `Curves.elasticOut`/`bounceOut` = no CSS equivalent. One spec can target both web and Flutter by naming the curve family.

### Hero — shared element transitions (Flutter's strength)
Two `Hero` widgets with the same `tag`; Flutter flies the widget in an overlay between routes, bounds on a `MaterialRectArcTween` (curved flight). Duration = the route transition's. `flightShuttleBuilder` for a custom in-flight widget; `transitionOnUserGestures: true` for iOS swipe-back. Debug: `timeDilation = 5.0`.

### Physics & gestures
```dart
onPanEnd: (details) {
  final unitVelocity = details.velocity.pixelsPerSecond.dy / size.height;
  const spring = SpringDescription(mass: 1, stiffness: 300, damping: 15); // underdamped = slight bounce
  controller.animateWith(SpringSimulation(spring, controller.value, 0, -unitVelocity));
}
```
`controller.fling()` uses `SpringDescription.withDampingRatio(mass: 1, stiffness: 500, ratio: 1.0)`. `DraggableScrollableSheet` handles snap-with-velocity automatically — designers only spec snap points (`snapSizes: [0.3, 0.7, 1.0]`).

### flutter_animate — the spec-friendly shorthand
```dart
Text("Hello").animate()
  .fade(duration: 300.ms)
  .slide(begin: const Offset(0, .2), curve: Curves.easeOutCubic);
// staggered lists:
children.animate(interval: 60.ms).fade(duration: 300.ms)
```
Closest Flutter analog to Reanimated presets — cheap to spec ("fade+slide-up 300ms easeOut, stagger 60ms").

### Rive / Lottie in Flutter
Same decision rule as web: Lottie for prebaked AE decorations (onboarding, empty states); Rive for interactive state-machine graphics (files 10–15× smaller, inputs respond to touch/data).

## 4. iOS vs Android conventions

What to spec differently per platform:

| Aspect | iOS | Android (Material 3) |
|---|---|---|
| Model | **spring**: perceptual duration + bounce (iOS 17+ default) | **duration + cubic curve token** (M3 Expressive adds springs, Compose-first) |
| SwiftUI defaults | `.spring` response 0.55 / dampingFraction 0.825; presets `.smooth`/`.snappy`/`.bouncy` | emphasized for large moves, standard for utility |
| Nav push | ~350ms parallax slide (incoming full-width, outgoing −30%) | fade-forwards / shared-axis X, 300–500ms emphasized |
| Modal | sheet with detents, spring settle | bottom sheet, standard decelerate ~300ms |
| Bounce | small bounce is platform-native | classic M3: none; Expressive: springs |
| Interruption | mandatory — retarget with velocity | increasingly expected (predictive back tracks gesture) |
| Overscroll | rubber-band | stretch (12+) |

Cross-platform frameworks default to ONE behavior. A spec must state the choice explicitly: platform-adaptive (`Platform.OS` / `pageTransitionsTheme` per platform) or one branded motion system everywhere. Both are valid; silence is not.

## 5. Reduce Motion on mobile

- **React Native:** Reanimated `useReducedMotion()` hook (synchronous); every animation accepts `reduceMotion: ReduceMotion.System` (default — snaps to final value when OS setting on); global `<ReducedMotionConfig />`. Raw RN: `AccessibilityInfo.isReduceMotionEnabled()` + `reduceMotionChanged` listener.
- **Flutter:** `MediaQuery.disableAnimationsOf(context)` — but iOS Reduce Motion is separately exposed as `WidgetsBinding.instance.accessibilityFeatures.reduceMotion`. Robust check = `disableAnimations || accessibilityFeatures.reduceMotion`. No per-animation flag — gate manually (`duration: reduce ? Duration.zero : Durations.medium2`).
- Same design rule as web: **reduce ≠ freeze** — replace slides/zooms/parallax with crossfades, keep functional feedback.

## Sources
Reanimated docs (docs.swmansion.com) + Reanimated 4 stable release blog · Gesture Handler docs · reactnative.dev (animations, accessibilityinfo) · Flutter docs (animations, hero-animations, physics-simulation) · api.flutter.dev (Curves, Durations, Easing, SpringSimulation) · flutter_animate (pub.dev) · motion.dev transitions · Apple WWDC23 "Animate with springs" · devsign.co navigation transitions · m3.material.io motion tokens · rive.app / lottiefiles.com

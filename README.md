# tailwindcss-duo

Tailwind CSS 4 plugin for the iPhone Duo. Pure CSS. No JavaScript.

## How do I install it?

```bash
npm install github:justinanastos/tailwindcss-duo#v0.1.0
```

Then add one line to your CSS:

```css
@import "tailwindcss";
@import "tailwindcss-duo";
```

The `#v0.1.0` part pins a git tag. This package is not on npm.

## What do I get?

| Variant | Matches when |
|---|---|
| `flat:` | Fully open or fully closed (`device-posture: continuous`) |
| `folded:` | Partly folded, any direction |
| `book:` | Partly folded, two segments side by side (landscape) |
| `tabletop:` | Partly folded, two segments stacked (portrait, like a flip-open DVD player) |
| `seg-x2:` `seg-y2:` | Two segments, whatever the posture |

| Utility | Does |
|---|---|
| `grid-cols-segments` | Two columns, one per segment |
| `grid-rows-segments` | Two rows, one per segment |
| `left-seg-2` `top-seg-2` | Start a box on the second segment |
| `w-seg-1` | Width of the first segment |
| `pt-safe` `pr-safe` `pb-safe` `pl-safe` `px-safe` `py-safe` `p-safe` | Padding from `env(safe-area-inset-*)` |

Every segment utility has a 50% fallback. Outside a fold it still works as a 50/50 split.

## Show me one

```html
<div class="grid grid-cols-1 book:grid-cols-segments tabletop:grid-rows-segments">
  <section>Left in book, top in tabletop, first block when flat</section>
  <section>Right in book, bottom in tabletop, second block when flat</section>
</div>
```

## Why do my variants never match?

The two Safari feature flags are off. Turn them on at Settings > Apps > Safari > Advanced > Feature Flags: "Device Posture API" and "Viewport Segments API". With the flags off, no posture variant matches and the page keeps its base layout.

## Things to know

- **No segment height utility.** iOS 27.2 reported 2242, 650, 673.5 and 475.5 for the same pose. Width and start position are stable, so the plugin uses only those.
- **Late JavaScript values.** Right after a fold, `navigator.devicePosture.type` is correct, but `matchMedia` and `window.viewport.segments` were stale and became correct about 1 s later. Read them again after a delay. When the CSS itself flips was not measured.
- **Safe areas need `viewport-fit=cover`** in the viewport meta tag. On the closed screen all insets are 0. On the open screen the bottom inset is 34.
- **Demo pages with `@tailwindcss/browser`** cannot `@import` a plugin. Use the Tailwind CLI or Vite.

## Where do the numbers come from?

See [docs/measurements.md](docs/measurements.md). The demo in [demo/](demo/) shows every variant and records what a device reports.

## How do I run the tests?

```bash
npm install
npm test
```

The tests build the plugin with the real Tailwind CLI and check the output CSS.

Not affiliated with Apple. iPhone is a trademark of Apple Inc.

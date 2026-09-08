# Commerce Theming — v0.8

Commerce themes are semantic token overrides. Do not fork component logic for light/dark mode or replace the tactile interaction grammar with theme-specific behavior.

## Theme switch

Set the theme on the document root:

```html
<html data-theme="light">
```

```js
document.documentElement.dataset.theme='dark';
```

Supported theme IDs are `light` and `dark`.

## Core semantic colors

The default token surface in `src/tokens.css` includes:

- `--nbc-bg` — page background
- `--nbc-surface` — primary raised/boxed surface
- `--nbc-surface-2` — secondary surface
- `--nbc-text` — primary text/ink
- `--nbc-muted` — secondary text
- `--nbc-border` — structural border
- `--nbc-shadow` — physical depth shadow
- `--nbc-focus` — focus indication
- `--nbc-success` / `--nbc-danger` — semantic outcome colors
- `--nbc-yellow`, `--nbc-coral`, `--nbc-lime`, `--nbc-sky`, `--nbc-pink` — expressive Commerce accents

Override semantic roles first. Accent colors are intentionally expressive; do not use them to encode success/error meaning when semantic outcome tokens exist.

## Physical/tactile tokens

Commerce's tactile grammar is part of the design contract:

- `--nbc-border-w`
- `--nbc-depth`
- `--nbc-press-hover`
- `--nbc-press-active`
- `--nbc-ease-press`
- `--nbc-ease-release`
- `--nbc-motion-fast`
- `--nbc-motion-standard`

Normal controls must never lift upward on hover. Hover compresses depth; active press consumes the remaining depth.

If you change depth values, keep this relationship coherent:

`0 <= hover compression <= active compression <= raised depth`

## Radius scale

- `--nbc-radius-sm`
- `--nbc-radius-md`
- `--nbc-radius-lg`

Commerce can become sharper or softer through these tokens, but retain visible structural borders and physical depth.

## Fluid spacing

The spacing system is intentionally `clamp()` based:

- `--nbc-space-1` through `--nbc-space-7`

Prefer these tokens over adding one-off breakpoint-only spacing values.

## Fluid type

- `--nbc-text-xs`
- `--nbc-text-sm`
- `--nbc-text-md`
- `--nbc-text-lg`
- `--nbc-text-xl`
- `--nbc-text-2xl`
- `--nbc-text-display`

The display scale is intentionally large for pricing/storefront hierarchy. Do not shrink it globally to solve one dense component; fix that component's hierarchy instead.

## Custom brand theme example

Apply overrides after Commerce styles:

```css
:root{
  --nbc-bg:#fffdf5;
  --nbc-surface:#ffffff;
  --nbc-surface-2:#f5f0e6;
  --nbc-text:#111111;
  --nbc-border:#111111;
  --nbc-shadow:#111111;
  --nbc-focus:#174ea6;
  --nbc-yellow:#ffd54a;
}

[data-theme="dark"]{
  --nbc-bg:#121212;
  --nbc-surface:#1d1d1d;
  --nbc-surface-2:#292929;
  --nbc-text:#fffaf0;
  --nbc-border:#fffaf0;
  --nbc-shadow:#000000;
  --nbc-focus:#a8c7fa;
}
```

## Accessibility requirements

Every custom theme must preserve:

- WCAG A/AA contrast on production routes
- visible `:focus-visible`
- reduced-motion behavior
- forced-colors legibility
- at least the existing touch-target contract
- readable ownership/payment states without relying on color alone

Run:

```bash
npm run check
npm run test:browser
```

The v0.7+ browser gate includes strict Axe scans, reduced-motion, forced-colors, responsive checks and visual fingerprints.

## Theme rule for agents

When an agent is asked to "make Commerce match this brand," change semantic tokens first. Do not rewrite component anatomy, state names, action contracts or provider boundaries to achieve a visual theme.
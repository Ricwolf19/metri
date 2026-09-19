# Brand & assets

The brand mark is a lime **dumbbell** rendered as bars, paired with the `metri` wordmark, on a
near-black background. SVG sources live in `assets/images/`; the launcher PNGs in
`assets/images/` are generated from them (e.g. with `rsvg-convert -w 1024 -h 1024 …`).

| File                                | What it is                               | Used for                             |
| ----------------------------------- | ---------------------------------------- | ------------------------------------ |
| `assets/images/metri.svg`           | Full logo (mark + wordmark) on dark bg   | Master / reference                   |
| `assets/images/metri-logo.svg`      | Mark + wordmark, transparent, tight crop | In-app cover (`src/app/index.tsx`)   |
| `assets/images/metri-icon.svg`      | Dumbbell mark only, black background     | App launcher icon                    |
| `assets/images/metri-icon-mono.svg` | Dumbbell mark, white on transparent      | Android 13+ themed (monochrome) icon |

Palette: lime accent `#bef82b` on a cool, blue-tinted dark "ink" scale (app background
`#0b0d12`). See `tailwind.config.js`.

In-app, SVGs are imported as components via `react-native-svg-transformer` (configured in
`metro.config.js`), e.g. `import MetriLogo from '@/assets/images/metri-logo.svg'`.

# games

Small browser games written in TypeScript and rendered on an HTML canvas. Currently: **Pong** (you on the left, a computer opponent on the right, first to 7 wins).

The page shows a black court with a dashed net, two white paddles, a square ball and the score above each side. Below the court are on-screen up, start/pause, restart and down buttons for touch devices.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move paddle | `W` / `S` or `Up` / `Down` | Drag on the court, or hold the up/down buttons |
| Start / resume | `Space` or `Enter` | Tap the court or the Start/Resume button |
| Pause | `P` or `Esc` | Pause button |
| Restart | `R` | Restart button |

The game also pauses when the tab or window loses focus.

## Accessibility

- The canvas is focusable and its label reports the current score and state; a live region announces start, pause, scores and the winner.
- All controls work from the keyboard and have visible focus rings; touch targets are at least 44px tall.
- With `prefers-reduced-motion: reduce` the simulation runs at 65% speed.

## Development

Requires Node 20+.

```sh
npm install
npm run dev        # dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm test           # unit tests for the game logic (Vitest)
npm run lint       # ESLint
```

Game rules live in `src/pong/logic.ts` as pure functions (no DOM), tuned by `src/pong/constants.ts`. `src/pong/index.ts` is the `<pong-game>` custom element handling input, rendering and the animation loop.

## Deploy

`npm run build` writes a static site to `dist/` with a relative base path, so it can be served from any static host or a GitHub Pages sub-path. For GitHub Pages, set Settings > Pages > Source to GitHub Actions and publish `dist/` with `actions/upload-pages-artifact` and `actions/deploy-pages` after `npm ci && npm run build`.

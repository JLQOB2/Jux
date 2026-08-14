# Jux

A web-based logic puzzle game inspired by LinkedIn's Tango, built with TypeScript and React.

Playable in any modern browser — desktop or mobile.

## Project structure

```
Jux/
├── index.html          # Entry page; loads the app
├── src/
│   ├── main.tsx        # Boots React and mounts <App /> into the page
│   ├── App.tsx         # Root UI component
│   └── engine/         # Game engine: board model, rules, validation, generation.
│                       # Pure TypeScript — no React, no DOM. Unit-tested.
├── vite.config.ts      # Vite (dev server + bundler) and Vitest configuration
└── tsconfig.json       # TypeScript compiler configuration
```

The engine stays UI-free by convention so game logic can be tested in isolation
and the React layer stays a thin shell over it.

## Getting started

```sh
pnpm install      # install dependencies
pnpm dev          # start the dev server (http://localhost:5173)
```

## Scripts

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `pnpm dev`        | Dev server with hot reload                    |
| `pnpm test`       | Run the test suite once                       |
| `pnpm test:watch` | Re-run tests on file changes                  |
| `pnpm typecheck`  | Type-check without emitting anything          |
| `pnpm build`      | Type-check + production build into `dist/`    |
| `pnpm preview`    | Serve the production build locally            |

## Status

Engine in progress. Rules are settled: even n×n boards (6×6 easy, 8×8 medium,
10×10 hard), two icons, balance + no-three-in-a-row + adjacency-marker
constraints, unique-solution puzzles. Board model done; validation is next.

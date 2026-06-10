# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server
npm run build     # production build
npm test          # run tests in watch mode
npm test -- --run # run tests once (CI)
```

To run a single test file:
```bash
npm test -- src/tests/MainMenu.test.js --run
```

## Architecture

This is a turn-based browser tactics game (single player vs AI) built with Vue 3 + Vite + Pinia. Vue Router handles navigation between screens.

**Routing** — `src/router/index.js` defines all routes. The root view (`/`) is eagerly loaded; game views use lazy imports. `src/App.vue` is a thin shell containing only `<RouterView />`.

Screen flow: `MainMenu → SquadSelect → GameBoard → AfterMission → MainMenu`

**Views vs Components** — Screens (full-page route targets) live in `src/views/`. Reusable UI pieces live in `src/components/` (currently `SoldierCard.vue`).

**Pinia Stores** — live in `src/stores/`:
- `squadStore.js` — soldier roster, selected squad (max 4), select/deselect actions. The full `ROSTER` definition lives here. Squad selection persists across navigation.
- `missionStore.js` — mission lifecycle (`idle → active → complete/failed`), map size, turn count, enemy stubs. `mission.start(size)` is called when `GameBoard` mounts.

**GameBoard** — all map generation and game state lives in `src/views/GameBoard.vue`:
- Map is an NxN grid (15–25) generated fresh each mission using a cluster flood-fill algorithm for cover
- `cells[]` is a flat array of terrain types: `empty`, `half`, `hard`, `deploy` — built once on mount, never mutated
- `soldierPositions` (reactive object) maps `cellIndex → soldier` — this is the source of truth for where soldiers are
- `movesRemaining` (reactive object) maps `soldier.id → number` — each soldier gets 5 moves per turn
- BFS (`getMovementRange`) calculates reachable tiles — cover blocks movement, soldiers pass through each other
- Selecting a soldier shows the movement range and keeps the soldier selected after moving for follow-up actions

**SCSS** — Global styles and the CSS reset are in `src/styles/main.scss`, imported once in `src/main.js`. `src/styles/_variables.scss` holds design tokens (colors, spacing). These variables are auto-injected into every component's `<style lang="scss" scoped>` block via `vite.config.js` `additionalData`, so no `@use` import is needed inside components.

**Tests** — Vitest + `@vue/test-utils`. Test files live in `src/tests/`. Tests that involve routing must create their own `createMemoryHistory` router instance rather than importing the app router, to keep tests isolated.

**Path alias** — `@` resolves to `src/`, available in both JS imports and SCSS `@use` paths.

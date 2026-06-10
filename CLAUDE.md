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
- `squadStore.js` — soldier roster, selected squad (max 4), select/deselect actions. The full `ROSTER` definition lives here. Each roster entry carries base stats: `maxHp: 5`, `maxAmmo: 3`, `movesPerTurn: 5`. Squad selection persists across navigation.
- `missionStore.js` — mission lifecycle (`idle → active → complete/failed`), map size, turn count, enemy stubs, and all per-soldier combat stats.

**Soldier stats** — `missionStore` owns the live per-soldier state, keyed by `soldier.id`:
```js
soldierStats[id] = {
  hp, maxHp,           // health — 0 = down, ≤ -2 = instant dead
  ammo, maxAmmo,       // shots remaining
  moves, movesPerTurn, // tile movement remaining this turn
  actionsRemaining,    // AP remaining this turn (starts at 2)
  hasMoved,            // whether soldier has moved this turn (gates sprint)
  status,              // 'active' | 'down' | 'dead'
  bleedTimer,          // null when active; 2 when downed, counts down each turn end
}
```
Key constants exported from `missionStore`: `INSTANT_DEATH_FLOOR = -2`, `BLEED_ROUNDS = 2`, `ACTIONS_PER_TURN = 2`, `SPRINT_RANGE = 8`.
Key actions: `applyDamage(id, dmg)`, `tickBleedTimers()`, `spendAmmo(id)`, `resetMoves()` (resets moves + AP + hasMoved for all active soldiers).
`mission.start(size, soldiers)` initialises stats from each soldier's base stats. Call `resetMoves()` at the start of each player turn.

**Action point system** — each soldier gets 2 AP per turn:
- Normal move (up to `movesPerTurn` tiles) costs 1 AP on first move; further tile moves within the same turn are free (`hasMoved` flag tracks this)
- Sprint (up to `SPRINT_RANGE` tiles) costs 2 AP and is only available when `!hasMoved && actionsRemaining >= 2`
- Shoot / item use will cost 1 AP each (not yet implemented)
- `mission.allActionsSpent` computed returns true when every active soldier has `actionsRemaining === 0` — used to highlight the End Turn button (⚠️ known bug: button highlight not triggering reliably; under investigation)

**GameBoard** — all map generation and game state lives in `src/views/GameBoard.vue`:
- Map is an NxN grid (15–25) generated fresh each mission using a cluster flood-fill algorithm for cover
- `cells[]` is a flat array of terrain types: `empty`, `half`, `hard`, `deploy` — built once on mount, never mutated
- `soldierPositions` (reactive object) maps `cellIndex → soldier` — source of truth for where soldiers are
- `highlightedCells` is a `Map<cellIndex, { movesUsed, apCost }>` — `apCost 1` = green (normal), `apCost 2` = orange (sprint)
- `getMovementRange(fromIndex, stats)` runs BFS — cover blocks movement, soldiers pass through each other; sprint tiles only shown when `canSprint`
- Selecting a soldier shows movement range; soldier stays selected after moving for follow-up actions
- End Turn calls `tickBleedTimers()` → `resetMoves()` → `nextTurn()` and clears selection

**Icons** — `@phosphor-icons/vue` (Phosphor Icons). Currently used in the soldier HUD: `PhHeart` (health), `PhCrosshair` (ammo), `PhFootprints` (movement).

**SCSS** — Global styles and the CSS reset are in `src/styles/main.scss`, imported once in `src/main.js`. `src/styles/_variables.scss` holds design tokens (colors, spacing). These variables are auto-injected into every component's `<style lang="scss" scoped>` block via `vite.config.js` `additionalData`, so no `@use` import is needed inside components.

**Tests** — Vitest + `@vue/test-utils`. Test files live in `src/tests/`. Tests that involve routing must create their own `createMemoryHistory` router instance rather than importing the app router, to keep tests isolated.

**Path alias** — `@` resolves to `src/`, available in both JS imports and SCSS `@use` paths.

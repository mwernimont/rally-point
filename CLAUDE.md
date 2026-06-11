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

**Routing** — `src/router/index.js` defines all routes. The root view (`/`) is eagerly loaded; game views use lazy imports. `src/App.vue` is a thin shell containing `<RouterView :key="$route.fullPath" />` — the key forces a full remount when the path or query changes, which is how Restart/Play Again work (they push `/game?t=<timestamp>`).

Screen flow: `MainMenu → SquadSelect → GameBoard → AfterMission → MainMenu`

**Views vs Components** — Screens (full-page route targets) live in `src/views/`. Reusable UI pieces live in `src/components/` (currently `SoldierCard.vue`).

**Pinia Stores** — live in `src/stores/`:
- `squadStore.js` — soldier roster, selected squad (max 4), select/deselect actions. The full `ROSTER` definition lives here. Each roster entry carries base stats: `maxHp: 5`, `maxAmmo: 3`, `movesPerTurn: 5`. Squad selection persists across navigation.
- `missionStore.js` — mission lifecycle (`idle → active → complete/failed`), map size, turn count, enemy list, and all per-soldier/per-enemy combat stats.

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
Key constants from `missionStore`: `INSTANT_DEATH_FLOOR = -2`, `BLEED_ROUNDS = 2`, `ACTIONS_PER_TURN = 2`, `SPRINT_RANGE = 8`.
Key actions: `applyDamage(id, dmg)`, `tickBleedTimers()`, `spendAmmo(id)`, `resetMoves()` (resets moves + AP + hasMoved for all active soldiers).
`mission.start(size, soldiers)` initialises stats from each soldier's base stats. Call `resetMoves()` at the start of each player turn.
When `applyDamage` transitions a soldier to `'down'`, it immediately zeroes `actionsRemaining` and `moves` — downed soldiers cannot act.

**Enemy stats** — all enemies share the same base constants (`ENEMY_MAX_HP = 3`, `ENEMY_MAX_AMMO = 3`, `ENEMY_MOVES_PER_TURN = 5`, `ENEMY_ACTIONS_PER_TURN = 2`). Live state is keyed by `enemy.id` in `mission.enemyStats`:
```js
enemyStats[id] = { hp, maxHp, ammo, maxAmmo, moves, movesPerTurn, actionsRemaining, status }
```
`mission.spawnEnemies(enemyList)` populates both `enemies` and `enemyStats`. `mission.applyEnemyDamage(id, dmg)` reduces HP and sets status to `'dead'` — dead enemies remain in `enemies` as corpses. `mission.livingEnemies` is a computed that filters to status `!== 'dead'`; use it everywhere combat logic needs active enemies.

**Enemy spawn** — GameBoard generates 4–8 enemies on the opposite edge from the player using a lane-based system. The map is divided into N equal lanes (one per enemy); each enemy spawns at a random empty cell within their lane's 4-row zone. Avoids cover cells.

**Action point system** — each soldier gets 2 AP per turn:
- Normal move (up to `movesPerTurn` tiles) costs 1 AP on first move; further tile moves within the same turn are free (`hasMoved` flag tracks this)
- Sprint (up to `SPRINT_RANGE` tiles) costs 2 AP and is only available when `!hasMoved && actionsRemaining >= 2`
- Shoot costs 1 AP and 1 ammo per shot
- `mission.allActionsSpent` computed returns true when every active soldier has `actionsRemaining === 0` — used to highlight the End Turn button

**Shooting** — player selects a soldier, clicks the Shoot button in the HUD to enter targeting mode. Valid targets (enemies with unobstructed LOS) are highlighted. Click a target to fire (1 dmg, 1 AP, 1 ammo). Hard cover blocks LOS (Bresenham raycast). `shootMode` ref gates targeting; `shootableTargets` and `hasValidTargets` are computeds derived from `mission.livingEnemies` + LOS checks.

**Turn flow** — Player turn → End Turn → enemy phase → Player turn. A turn banner below the map shows current phase. End Turn calls `tickBleedTimers()` → `runEnemyTurn()` → `resetMoves()` → `nextTurn()`. End Turn is disabled during the enemy phase, on `missionWon`, and on `missionLost`.

**GameBoard** — all map generation and game state lives in `src/views/GameBoard.vue`:
- Map is an NxN grid (15–25) generated fresh each mission using a cluster flood-fill algorithm for cover
- `cells[]` is a flat array of terrain types: `empty`, `half`, `hard`, `deploy` — built once on mount, never mutated
- `soldierPositions` (reactive object) maps `cellIndex → soldier` — source of truth for where soldiers are
- `enemyPositions` (computed) maps `cellIndex → enemy` derived from `mission.livingEnemies`
- `corpsePositions` (computed) maps `cellIndex → enemy` for dead enemies — used for the `.enemy-dead` cell class; hidden when a live entity occupies the same cell
- `missionWon` (computed) — true when `mission.livingEnemies` is empty; shows victory overlay
- `missionLost` (computed) — true when all `soldierStats` are non-active; shows defeat overlay
- `highlightedCells` is a **computed** `Map<cellIndex, { movesUsed, apCost }>` derived from selected soldier's live stats — `apCost 1` = green (normal), `apCost 2` = orange (sprint). Being computed (not a ref) ensures stale movement tiles can never appear after AP is spent.
- `getMovementRange(fromIndex, stats)` runs BFS — cover blocks movement, soldiers pass through each other; sprint tiles only shown when `canSprint`
- Selecting a soldier shows movement range; soldier stays selected after moving for follow-up actions

**Icons** — `@phosphor-icons/vue` (Phosphor Icons). Used in the soldier HUD: `PhHeart` (health), `PhCrosshair` (ammo), `PhFootprints` (movement), `PhLightning` (AP).

**SCSS** — Global styles and the CSS reset are in `src/styles/main.scss`, imported once in `src/main.js`. `src/styles/_variables.scss` holds design tokens (colors, spacing). These variables are auto-injected into every component's `<style lang="scss" scoped>` block via `vite.config.js` `additionalData`, so no `@use` import is needed inside components.

**Tests** — Vitest + `@vue/test-utils`. Test files live in `src/tests/`. Tests that involve routing must create their own `createMemoryHistory` router instance rather than importing the app router, to keep tests isolated.

**Path alias** — `@` resolves to `src/`, available in both JS imports and SCSS `@use` paths.

# Rally Point

A turn-based tactical strategy game built with Vue 3 + Pinia.

## Current State

### Completed
- **Main Menu** → **Squad Select** → **Game Board** routing via Vue Router
- **Squad Select**: players pick up to 4 soldiers from a roster, deploy button disabled until at least one is selected. Available soldiers dim when squad is full. Selection cleared on deploy.
- **Game Board**: procedurally generated square grid (10–30 random size), cover generation (~12% of cells, 70% half / 30% hard), deployment zone on a random edge, soldiers placed in deployment zone.
- **Soldier selection**: clicking a soldier cell on the map sets `activeSoldier` in `missionStore`. Active soldier is highlighted on the map (`active-soldier` class). Soldier UI strip at the top shows the active soldier's stats.
- **Soldier UI strip**: displays name, avatar (color), and all stats (current/max) for the active soldier. Hidden via `v-if` when no active soldier.
- **Soldier movement**: clicking a valid move cell moves the active soldier and deducts the path cost from `currentMovement`. Valid cells highlighted on the map.
- **End Turn**: resets `currentMovement` and `currentAp` for all soldiers, increments `currentTurn`, auto-selects first living soldier, logs turn start.
- **Game Log**: sidebar log with color-coded entries by type (`turn`, `move`). Newest entries at top. `logEvent(message, type)` is the single function all actions call.
- **Enemies on board**: Enemies randomly selected from `enemyStore` pool via `pickEnemies(count)`, placed on the opposite edge from players. Enemy cells render with `enemy-deploy-zone` class. Clicking an enemy cell is ignored (faction check in `onCellClick`).
- **Unit class icons**: Phosphor Icons rendered on unit cells via dynamic `<component :is="classIcons[cell.unit.class]">` lookup. `classIcons` map lives in `GameBoard.vue` as a display concern.

### Architecture
- `soldierStore` — source of truth for the full player soldier roster
- `enemyStore` — source of truth for enemy roster. Exposes `pickEnemies(count)` which shuffles the pool and returns `count` deep-copied enemies.
- `selectionStore` — tracks which soldiers the player has selected, max squad size (4)
- `missionStore` — single source of truth for all mission state: grid, units, turn/phase, game log. Exposes mutation functions (`applyDamage`, `applyInjury`, `logEvent`, etc.) that other stores call to commit results. Never calls into `combatStore` or `injuryStore` directly.
- `combatStore` *(planned)* — pure calculator. Resolves LoS, hit chance, damage. Takes inputs, returns a result object. Never mutates state directly.
- `injuryStore` *(planned)* — pure calculator. Rolls and resolves injuries based on inputs. Returns result. Never mutates state directly.
- `gameStore` *(planned)* — the director/brain. `GameBoard` talks to `gameStore` instead of individual stores. Sequences the chain of events (shot resolves → damage applied → death checked → injury rolled → log written). Knows the order; the other stores don't know each other exist.
- `GameBoard.vue` — pure rendering view, reads from `missionStore`. Fires actions to `gameStore`. Owns display concerns: `sidebarWidth`, `gapSize`, `cellSize` computed, `windowWidth` reactive ref

### Data Model
Each cell has: `id`, `row`, `col`, `zone` (null | 'deploy' | 'enemy-deploy'), `cover` (null | 'half' | 'hard'), `unit` (null | unit object)
Each soldier has: `id`, `name`, `color`, `class`, `faction` ('player'), `currentHealth`, `maxHealth`, `currentArmor`, `maxArmor`, `currentAmmo`, `maxAmmo`, `currentAp`, `maxAp`, `currentMovement`, `maxMovement`, `items`, `injuries`, `row`, `col`
Each enemy has: same shape as soldier but `faction: 'enemy'`

### Map Generation Pipeline
Order matters — each step depends on the previous:
1. `pickSpawnEdge` — picks a random edge ('top' | 'bottom' | 'left' | 'right')
2. `pickOppositeEdge(edge)` — returns the opposing edge
3. `generateGrid(min, max, playerEdge, enemyEdge)` — builds cells, marks both deploy zones (2 deep, unit-count-width, centered on edge), cover skipped for zone cells. Uses `isOnEdge(row, col, edge, zoneStart, zoneEnd)` helper to avoid duplicate positional logic.
4. `placeSoldiers` — filters `zone === 'deploy'` cells, assigns soldiers in index order
5. `placeEnemies` — filters `zone === 'enemy-deploy'` cells, assigns enemies in index order

### Flow
1. Player selects soldiers in `SquadSelect`
2. Deploy button calls `missionStore.startMission(selectedSoldiers)` then routes to `/game`
3. `startMission` deep-copies selected soldiers (faction baked into `soldierStore`), calls `enemyStore.pickEnemies(count)`, picks spawn edges, generates grid, places soldiers and enemies

## Next Up
- Dynamic enemy count based on difficulty
- Turn-based combat loop (shooting → LoS → hit chance → cover → reload)

## Stores To Build

### `combatStore`
- Create `src/stores/combatStore.js`
- Imports `missionStore` to read grid/cell state for LoS calculation
- Functions to build:
  - `hasLoS(shooter, target)` — ray cast between two units, returns bool. Hard cover cells block it.
  - `getRangeBracket(shooter, target)` — BFS distance → `'close' | 'medium' | 'long'`
  - `resolveShot(shooter, target)` — runs LoS, range, accuracy, cover bonus, dice roll. Returns `{ hit: bool, roll: number, hitChance: number, bracket: string, coverBonus: number }`
- Returns results only — never calls `missionStore` mutations directly

### `gameStore`
- Create `src/stores/gameStore.js`
- Imports `missionStore`, `combatStore`, `injuryStore` (when built)
- `GameBoard.vue` imports `gameStore` for all player actions (shoot, reload, move is still `missionStore` for now)
- Functions to build:
  - `handleShot(shooter, target)` — calls `combatStore.resolveShot()`, then sequences: `missionStore.applyDamage()`, death check, `missionStore.logEvent()`. Will later add injury roll when `injuryStore` exists.
  - `handleReload(soldier)` — sets `soldier.currentAmmo` to `soldier.maxAmmo`, marks `acted`, logs it. Can live here or in `missionStore` — TBD.
  - `handleEnemyTurn()` — sequences all enemy moves, then flips `currentPhase` back to `'player'`

### Connecting them
- `missionStore` needs new mutation functions: `applyDamage(unit, amount)`, and eventually `applyInjury(unit, injury)`
- `missionStore` needs `acted` tracking: add `acted` boolean to each unit, reset in `endTurn()`
- `GameBoard.vue` currently calls `missionStore.endTurn()` directly — this should route through `gameStore.handleEndTurn()` so the enemy turn can be sequenced after

## Combat Design (planned, not yet implemented)

### Action Economy
- Movement is free (up to `currentMovement`)
- Each unit gets one action per turn tracked by an `acted` boolean (reset on turn start)
- AP stat reserved for future multi-action abilities — not used yet
- Actions: Shoot (costs action), Reload (costs action, restores `currentAmmo` to `maxAmmo`)

### Line of Sight
- Hard cover blocks LoS entirely — cannot target through or behind it
- Half cover does not block LoS but grants the target a defense bonus

### Hit Chance Formula
```
hitChance = accuracyByRange[rangeBracket] - coverBonus
```
- `rangeBracket` derived from BFS step distance between shooter and target
- Brackets: close = 1–3, medium = 4–7, long = 8+
- `coverBonus` applied when target is in half cover (TBD value)
- Roll a random number, compare to hitChance → hit or miss

### Accuracy by Range
Each unit type has `accuracyByRange: { close, medium, long }` stored in `soldierStore`/`enemyStore`. No flat accuracy stat — all class differentiation lives in the data.
- **Ranger**: high close/medium, drops off at long
- **Scout**: low close, peaks at long (inverse curve)
- **Heavy**: capped across all ranges (never great, but consistent), compensated with high ammo
- **Medic/Radio**: TBD, likely mediocre across the board

### Game Log
Hit resolution logs the full math and result:
`Ranger shot Heavy → 75% (medium) - 20% (half cover) = 55% → Hit! [32 rolled]`

### Enemy Turn (movement only, to start)
- Phase tracked by `currentPhase` ref (`'player' | 'enemy'`) in `missionStore`
- End Turn flips to `'enemy'` phase, runs enemy moves, then flips back to `'player'`
- Enemy AI: BFS toward nearest player soldier, move up to full `currentMovement`, stop one cell short of occupied cells

## Dev Notes
- User writes the code — Claude is a thinking partner only, no writing code unless scaffolding comments
- Keep GameBoard as a pure view. It reads from `missionStore` and fires actions to `gameStore` — nothing else.
- `combatStore` and `injuryStore` are pure calculators — they return results, never mutate state directly. All state mutations go through `missionStore` functions.
- `gameStore` is the sequencer — it knows the order of operations. If you're not sure where logic belongs, ask: is this math/calculation (combatStore/injuryStore), state mutation (missionStore), or sequencing (gameStore)?
- CSS variables live on `#game` (root container) so they cascade to all children
- Cells are a `ref` (not `computed`) so soldier placement mutations persist
- Movement uses BFS (not Chebyshev distance) so hard cover blocks pathing. `reachableMap` returns a `Map<cellId, stepCost>`. Diagonal moves are blocked if either orthogonal neighbor is hard cover (prevents corner-cutting). Half cover can be pathed through but not stopped on.
- Cell lookup is O(1) via `cells.value[row * gridSize.value + col]` — cell id equals its flat array index
